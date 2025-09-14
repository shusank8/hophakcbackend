import { corsHeaders } from "./cor_headers.js";

import {
  deletePublicShare,
  get_session_info,
  get_task_info,
  client,
  speechtotext,
} from "./utils.js";

Deno.serve(async (req) => {
  // CORS pre-flight request
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // making sure function is getting websocket request
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }

  // initializing a socket
  const { socket, response } = Deno.upgradeWebSocket(req);

  //   waiting for a connection
  socket.addEventListener("open", () => {});

  //   listening to a message
  socket.addEventListener("message", async (event) => {
    var query = event.data;
    if (typeof query != "string") {
      query = await speechtotext(query);
      socket.send(JSON.stringify({ speechtext: query }));
      return;
    }

    // from here
    const task = await client.tasks.createTask({
      task: query,
    });
    var goalSet = new Set();
    const task_id = task.id;
    var taskstatus = false;
    while (!taskstatus) {
      var task_info = await get_task_info(task_id);

      var sessionId = task_info.sessionId;

      if (task_info.steps.length != 0) {
        var last_step = task_info.steps[task_info.steps.length - 1];
        var goal = last_step.nextGoal;
        if (!goalSet.has(goal) && goal.length != 0) {
          goalSet.add(goal);

          socket.send(JSON.stringify({ unique_goal: goal }));
        }

        var sessioninfo = await get_session_info(sessionId);

        if (sessioninfo.liveUrl !== null) {
          if (last_step.url != "about:blank") {
            socket.send(JSON.stringify({ liveUrl: sessioninfo.liveUrl }));
          }
        }
      }
      if (task_info.status === "finished") {
        taskstatus = true;

        socket.send(JSON.stringify({ final_response: task_info.output }));

        await deletePublicShare(sessionId);
      }
      await new Promise((r) => setTimeout(r, 4000)); // sleep
      console.log("-------------------");
    }
  });

  return response;
});
