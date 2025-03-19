import os
from openai import AsyncOpenAI
import simplejson as json
from agents import Agent, Runner, FileSearchTool, WebSearchTool, ComputerTool, function_tool, set_default_openai_api, set_default_openai_client, set_tracing_disabled
from dotenv import load_dotenv
import asyncio

load_dotenv()  

OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPEN_AI_MODEL = "gpt-4o"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GROK_BASE_URL = "https://api.x.ai/v1"
GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_MODEL = "grok-2-1212"
CLAUDE_BASE_URL = "https://api.anthropic.com/v1"
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
GEMINI_BASE_URL = "https://api.gemini.com/v1"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = AsyncOpenAI(base_url=OPENAI_BASE_URL, api_key=OPENAI_API_KEY)

set_default_openai_client(client=client, use_for_tracing=False)
set_default_openai_api("chat_completions")
set_tracing_disabled(disabled=True)

MODEL = OPEN_AI_MODEL

@function_tool
def upsert_agent(name: str, instructions: str):
    with open('data\agent.json', 'r', encoding='utf-8') as f:
        agents = json.load(f)

    if not isinstance(agents, list):
        agents = []

    agent_exists = False
    for i, agent in enumerate(agents):
        if agent["name"] == name:
            agents[i] = {
                "name": name,
                "instructions": instructions,
                "model": MODEL
            }
            agent_exists = True
            break

    if not agent_exists:
        new_agent = {
            "name": name,
            "instructions": instructions,
            "model": MODEL
        }
        agents.append(new_agent)

    with open('data/agent.json', 'w', encoding='utf-8') as f:
        json.dump(agents, f, ensure_ascii=False, indent=4)

    return agents

def load_agents():
    with open('data/agent.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    agents = []
    for item in data:
        agent = Agent(
            name=item["name"],
            instructions=item["instructions"],
            model=MODEL,
        )
        agents.append(agent)
    return agents

def find_agent_by_name(agents, name):
    for agent in agents:
        if agent.name == name:
            return agent
    return None

agents = load_agents()
find_agent_by_name(agents, "HR").tools = [upsert_agent]

Manager = Agent(name="Manager", instructions="我是Manager, 负责调用一切资源协助客户完成需求", model=MODEL,handoffs=agents)

user_input = input()
while user_input.lower() != "exit":
    result = Runner.run_sync(Manager, user_input.strip())
    print(result.final_output)
    user_input = input()









