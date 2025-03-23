import os
import re
from openai import AsyncOpenAI
import yaml
from agents import Agent, Runner, FileSearchTool, WebSearchTool, ComputerTool, function_tool, set_default_openai_api, set_default_openai_client, set_tracing_disabled
from dotenv import load_dotenv
import asyncio
from typing import Dict, Any, Optional, Tuple

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

class OutputParser:
    """
    解析AI输出结果，提取结构化信息。
    可以处理多种提取模式，用于从AI对话中提取关键变量。
    """
    
    @staticmethod
    def extract_agent_info(text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        从AI输出文本中提取代理名称和指令。
        
        参数:
            text (str): AI的输出文本
            
        返回:
            Tuple[Optional[str], Optional[str]]: 提取的(名称, 指令)元组，若未找到则对应值为None
        """
        # 尝试提取名称
        name_pattern = r"代理名称[\s]*[:：][\s]*(.*?)(?:\n|$)"
        name_match = re.search(name_pattern, text, re.IGNORECASE)
        
        # 尝试提取指令
        instructions_pattern = r"代理指令[\s]*[:：][\s]*([\s\S]*?)(?:(?:\n\s*代理(?!指令|名称))|$)"
        instructions_match = re.search(instructions_pattern, text, re.DOTALL)
        
        # 备用模式: 寻找以"指令:"开头的多行文本块
        if not instructions_match:
            instructions_pattern = r"指令[\s]*[:：][\s]*([\s\S]*?)(?:(?:\n\s*(?!指令))|$)"
            instructions_match = re.search(instructions_pattern, text, re.DOTALL)
        
        # 提取结果
        name = name_match.group(1).strip() if name_match else None
        instructions = instructions_match.group(1).strip() if instructions_match else None
        
        return name, instructions
    
    @staticmethod
    def extract_structured_data(text: str, patterns: Dict[str, str]) -> Dict[str, Any]:
        """
        使用自定义模式从文本中提取多个变量
        
        参数:
            text (str): 要解析的文本
            patterns (Dict[str, str]): 变量名到正则表达式模式的映射
            
        返回:
            Dict[str, Any]: 提取的变量字典
        """
        result = {}
        
        for var_name, pattern in patterns.items():
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                result[var_name] = match.group(1).strip()
        
        return result

@function_tool
def upsert_agent(result: str):
    """
    从AI输出中提取代理信息并更新或创建代理
    
    参数:
        result (str): AI的输出结果，包含代理名称和指令
        
    返回:
        list: 更新后的代理列表
    """
    # 从输出中提取代理名称和指令
    name, instructions = OutputParser.extract_agent_info(result)
    
    if not name or not instructions:
        return {"error": "无法从输出中提取代理名称或指令"}
    
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

    return {"success": True, "name": name, "agents": agents}

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
find_agent_by_name(agents, "HR").tools.append(upsert_agent)
Manager = Agent(name="Manager", instructions="我是Manager, 负责调用一切资源协助客户完成需求", model=MODEL,handoffs=agents)


while True:
    user_input = input("> ")
    if user_input.lower() == "exit":
        break
    result = Runner.run_sync(Manager, user_input.strip())
    print(result.final_output)









