import os
import common
from agents import Agent, Runner
from dotenv import load_dotenv

load_dotenv()  
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

json_files = ['agents.json']

data = common.load_multiple_json_files(json_files)

agent = {}
for key, value in data.items():
    agent[key] = Agent(name=value['name'], instructions=value['instructions'])

Task = "主题：异世界，剑与魔法"
result = Runner.run_sync(agent['Ideator'], Task)
result = Runner.run_sync(agent['Architect'], result.final_output)

print(result.final_output)



