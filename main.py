import os
from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool, set_default_openai_api, set_default_openai_client, set_tracing_disabled
from dotenv import load_dotenv
from layer.common import load_multiple_json_files, save_to_json_file

load_dotenv()  

OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GROK_BASE_URL = "https://api.x.ai/v1"
GROK_API_KEY = os.getenv("GROK_API_KEY")
CLAUDE_BASE_URL = "https://api.anthropic.com/v1"
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
GEMINI_BASE_URL = "https://api.gemini.com/v1"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = AsyncOpenAI(base_url=GROK_BASE_URL, api_key=GROK_API_KEY)

set_default_openai_client(client=client, use_for_tracing=False)
set_default_openai_api("chat_completions")
set_tracing_disabled(disabled=True)

json_files = ['data/agent.json']

data = load_multiple_json_files(json_files)

HR = Agent(name="HR", instructions="", model="",handoffs=[Manager])

Manager = Agent(name="Manager", instructions="", model="",handoffs=[HR])

task = ""

result = Runner.run(Manager, input=task)

save_to_json_file(result, 'data/agent.json')

agent = {}
for key, value in data["agent"].items():
    agent[key] = Agent(name=value['name'], instructions=value['instructions'], model=value['model'])




