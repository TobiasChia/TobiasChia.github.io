import os
import layer.common as common
from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool, set_default_openai_api, set_default_openai_client, set_tracing_disabled
from dotenv import load_dotenv

load_dotenv()  

OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_BASE_URL = "https://api.x.ai/v1"
# CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = AsyncOpenAI(base_url=GROK_BASE_URL, api_key=GROK_API_KEY)

set_default_openai_client(client=client, use_for_tracing=False)
set_default_openai_api("chat_completions")
set_tracing_disabled(disabled=True)

# @function_tool
# def get_story(agent, task):
#     result = Runner.run_sync(agent['Ideator'], task)
#     result = Runner.run_sync(agent['Architect'], result.final_output)
#     return result.final_output


json_files = ['data/agent.json']

data = common.load_multiple_json_files(json_files)

agent = {}
for key, value in data["agent"].items():
    agent[key] = Agent(name=value['name'], instructions=value['instructions'], model=value['model'])

Task = "主题：异世界，剑与魔法"

result = Runner.run_sync(agent['Ideator'], Task)
print(result.final_output)

result = Runner.run_sync(agent['Architect'], result.final_output)
print(result.final_output)

common.save_to_json_file(result.final_output, 'data/story.json')



