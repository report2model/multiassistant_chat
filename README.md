# Multi-Assistant Chat

A simple cli chat interface that enables users to interact with various OpenAI Assistants. This application leverages the OpenAI Assistant API,
allowing for conversation threads and intelligent responses from multiple assistants based on user queries.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need Node.js and npm installed on your machine.

```bash
node --20.9.0
npm --10.1.0
```

# Installing

Clone the repository, install the dependencies, and start the application using the following commands:

```sh
# Clone the repository to your local machine
git clone https://github.com/report2model/multiassistant_chat

# Navigate to the project directory
cd your-project-root-directory

# Install dependencies (will auto-install from package.json)
npm install
```

# Configuration

Set your OpenAI API Key as a Global Enviroment Variable.

# Populate your allowed_assistants.json

Populate the allowed_assistants.json with your Assistant names and ID's structured as follows:

```
[
    {
        "name": "assistant-name",
        "id": "asst_xxxxxxxxxxxxxxxxxxxxxx",
    }
]
```

# Start the application

node index.js

# Usage

Once the application is running, select which assistant or assistants you would like to chat with. It will then list the attached files to the assistants if any are available. You can then query the assistants. At any time during an input you can type "new" to switch to a new assistant or type "exit" to exit the application.

# Application Structure

index.js: Contains the server setup, API routes, and interaction logic with the OpenAI API.
allowed_assistants.json: A JSON file containing a list of permitted OpenAI assistants by their IDs.

# API Documentation

This application uses the OpenAI Assistant API to manage conversational threads and messages. The API allows creating sessions with 'threads', sending and receiving 'messages', and managing the conversation session with 'runs'.

# Data Access and Security

We advise implementing proper authorization and restricting API key access to authorized users only to ensure data privacy and security.

# Contributing

Contributions to this project are welcome. Ensure that you follow the code of conduct and submit pull requests for your proposed changes.

# Authors

Konecheck

# License

This project is MIT licensed for open use by all.

# Acknowledgments

Kudos to the OpenAI team for providing the API and documentation that this project relies upon.

# Further Development

No further enhancements are planned currently.

# Need More Help?

For additional assistance or questions about this application, please contact the project maintainers at report2model@gmail.com.
