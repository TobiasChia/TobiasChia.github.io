import os
from openai import AsyncOpenAI
import yaml
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
GROK_IMAGE_MODEL = "grok-2-image-1212"
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
    try:
        with open('data/agent.yaml', 'r', encoding='utf-8') as f:
            agents = yaml.safe_load(f)
    except (FileNotFoundError, yaml.YAMLError):
        agents = []

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

    with open('data/agent.yaml', 'w', encoding='utf-8') as f:
        yaml.dump(agents, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    return agents

def load_agents():
    try:
        with open('data/agent.yaml', 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except (FileNotFoundError, yaml.YAMLError):
        data = []
    
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

Manager = Agent(name="Manager", instructions="我是Manager, 负责调用一切资源协助客户完成需求", model=MODEL,handoffs=agents)


while True:
    user_input = input("> ")
    if user_input.lower() == "exit":
        break
    result = Runner.run_sync(Manager, user_input.strip())
    print(result.final_output)









