// Import required dependencies
require("dotenv").config();
const OpenAI = require("openai");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const fs = require('fs');

// Create OpenAI API connection
const secretKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

// Utility function to ask a question in the console
async function askQuestion(prompt) {
  return new Promise((resolve) => {
    readline.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Read the list of allowed assistants from the 'allowed_assistants.json' file
function getAllowedAssistants() {
  const allowedAssistantsData = fs.readFileSync('allowed_assistants.json', 'utf8');
  const allowedAssistants = JSON.parse(allowedAssistantsData);
  return allowedAssistants;
}

// List and filter available assistants based on the allowed list
async function listAndFilterAssistants() {
  try {
    const allowedAssistants = getAllowedAssistants();
    let response = await openai.beta.assistants.list();
    const filteredAssistants = response.data.filter(assistant =>
      allowedAssistants.some(allowedAssistant => allowedAssistant.id === assistant.id)
    );
    return filteredAssistants;
  } catch (error) {
    console.error('Error listing or filtering assistants:', error);
    process.exit(1);
  }
}

// Prompt user to select assistants by number
async function selectAssistants(assistants) {
  console.log("Please select the assistants you would like to use by number, separated by commas:");
  assistants.forEach((assistant, index) => {
    console.log(`${index + 1}. ${assistant.name}`);
  });
  const selection = await askQuestion("Enter your selections: ");
  const selectedIndexes = selection.split(',').map(num => parseInt(num.trim()) - 1);
  const selectedAssistants = assistants.filter((_, index) => selectedIndexes.includes(index));
  if (selectedAssistants.length > 0) {
    return selectedAssistants;
  } else {
    console.log('Invalid selection. Please try again.');
    return selectAssistants(assistants); // Recursive call to ask again
  }
}

// Function to display available files for the selected assistants by fetching from OpenAI API
async function displayFilesForAssistants(selectedAssistants) {
  for (const assistant of selectedAssistants) {
    console.log(`\nFiles available for assistant '${assistant.name}':`);

    try {
      // Fetch and display file details by iterating over file IDs associated with each assistant
      const associatedFilesPromises = assistant.file_ids.map((fileId) =>
        openai.files.retrieve(fileId)
      );
      const associatedFiles = await Promise.all(associatedFilesPromises);

      associatedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.filename} (ID: ${file.id})`);
      });
    } catch (error) {
      console.error(`Error fetching file information for assistant '${assistant.name}':`, error);
    }
  }

  // Assuming files are identical across all assistants and returning the file IDs of the first assistant
  return selectedAssistants[0].file_ids;
}

// Function to create a new thread and handle user input, now supports selecting multiple assistants
async function createThreadWithAssistants(fileIDs, selectedAssistants) {
  const thread = await openai.beta.threads.create();
  let keepGoing = true;
  while (keepGoing) {
    // Ask for user input
    const userInput = await askQuestion("\nInput: ");
    // Handle special commands
    if (userInput.trim().toLowerCase() === "exit") {
      keepGoing = false;
      return "exit"; // Indicate that user wants to exit
    } else if (userInput.trim().toLowerCase() === "new") {
      keepGoing = false;
      return "new"; // Indicate that user wants to select a new assistant
    }

    // Process the input through each selected assistant in sequence
    for (const assistant of selectedAssistants) {
      // Sending user input to the thread with file context, if any fileIDs are associated
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userInput,
        ...(fileIDs.length ? { file_ids: fileIDs } : {}), // Include file_ids only if available
      });
      
      // Generate a run for the current assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
      });

      // Polling for the run to complete and displaying the response
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second polling interval
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      // Display the assistant's response
      if (runStatus.status === "completed") {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessageForRun = messages.data.filter(message => message.run_id === run.id && message.role === "assistant").pop();
        if (lastMessageForRun && lastMessageForRun.content.length) {
          console.log(`\nResponse from '${assistant.name}':\n${lastMessageForRun.content.map(part => part.text?.value).join('')}`);
        } else {
          console.log(`No response from the assistant '${assistant.name}' or unable to retrieve the message.`);
        }
      } else {
        // Handle non-completed run statuses
        console.log(`Run did not complete successfully for '${assistant.name}'. Status: ${runStatus.status}`);
      }
    }
  }
  readline.close();
}

async function main() {
  try {
    // Retrieve available assistants and filter based on the admin-designated list
    const assistants = await listAndFilterAssistants();
    let continueConversation = true;
    let selectedAssistants;
    let fileIDs;

    while (continueConversation) {
      if (!selectedAssistants) {
        // Prompt user to select assistants through numbered list
        selectedAssistants = await selectAssistants(assistants);
        // Display the available files for the chosen assistant(s)
        fileIDs = await displayFilesForAssistants(selectedAssistants);
        console.log(`\nWelcome! You are now using the following assistants: ${selectedAssistants.map(a => a.name).join(', ')}\n`);
      }

      // Create a thread and start a conversation with the selected assistant(s)
      const threadResult = await createThreadWithAssistants(fileIDs, selectedAssistants);

      if (threadResult === "exit") {
        continueConversation = false; // End the conversation
      } else if (threadResult === "new") {
        selectedAssistants = null; // Reset the assistant selection
      }
    }

    console.log("\nGoodbye!\n");
  } catch (error) {
    // Handle any errors
    console.error('An error occurred:', error);
  } finally {
    // Ensure the readline interface is always closed cleanly
    readline.close();
  }
}

// Start the script by calling the main function
main();