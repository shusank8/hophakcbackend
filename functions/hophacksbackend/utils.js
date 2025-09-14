import { BrowserUseClient } from "npm:browser-use-sdk";

const deleteurl = Deno.env.get("DELETE_URL");
const geturl = Deno.env.get("GET_TASK");
const openaiapi = Deno.env.get("OPENAIAPI");
const browswerapikey = Deno.env.get("BrowserUseAPIKey");

//   deleting session
async function deletePublicShare(sessionId) {
  const url = `${deleteurl}/${sessionId}/public-share`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-Browser-Use-API-Key": browswerapikey,
    },
  });

  if (response.status === 204) {
    console.log("✅ Public share removed successfully.");
  } else {
    console.error(`❌ Failed with status: ${response.status}`);
    const errorText = await response.text();
    console.error("Response:", errorText);
  }
}

//   creating a browser client

const client = new BrowserUseClient({
  apikey: browswerapikey,
  headers: {
    "X-Browser-Use-API-Key": browswerapikey,
  },
});

//   getting task info

async function get_task_info(taskid) {
  const response = await fetch(`${geturl}/${taskid}`, {
    method: "GET",
    headers: {
      "X-Browser-Use-API-Key": browswerapikey,
      "Content-Type": "application/json",
    },
  });
  var res = await response.json();
  return res;
}

//   getting session info
async function get_session_info(sessionid) {
  const response = await fetch(`${deleteurl}/${sessionid}`, {
    method: "GET",
    headers: {
      "X-Browser-Use-API-Key": browswerapikey,
      "Content-Type": "application/json",
    },
  });
  var res = await response.json();
  return res;
}
//   --------------------------------------------------

async function speechtotext(query) {
  // Ensure your OpenAI key is set as environment variable
  const apiKey = openaiapi;

  //   const openai = new OpenAI({ apiKey });

  const audioBlob = new Blob([query], { type: "audio/wav" });

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  formData.append("model", "whisper-1");
  formData.append("language", "en"); // Change as needed
  async function transcribeAudio(apiKey, formData) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Transcription text:", data.text);
      return data.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }
  query = await transcribeAudio(apiKey, formData);
  return query;
}

export {
  deletePublicShare,
  get_session_info,
  get_task_info,
  client,
  speechtotext,
};
