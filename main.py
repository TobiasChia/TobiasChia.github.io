import os
import common
from agents import Agent, Runner
from dotenv import load_dotenv

load_dotenv()  
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

json_files = ['data/agent.json']

data = common.load_multiple_json_files(json_files)

agent = {}
for key, value in data["agent"].items():
    print(key)
    print(value)
    agent[key] = Agent(name=value['name'], instructions=value['instructions'])

Task = "主题：异世界，剑与魔法"

result = Runner.run_sync(agent['Ideator'], Task)
result = Runner.run_sync(agent['Architect'], result.final_output)

common.save_to_json_file(result.final_output, 'data/story.json')



