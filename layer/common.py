import json

def load_multiple_json_files(file_paths):
    results = {}
    
    for file_path in file_paths:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                import os
                file_name = os.path.basename(file_path).split('.')[0]
                results[file_name] = data
        except Exception as e:
            print(f"加载文件 '{file_path}' 时出错: {str(e)}")
    
    return results

def save_to_json_file(data, file_path):
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
        print(f"数据已成功保存到 '{file_path}'")
        return True
    except Exception as e:
        print(f"保存数据时出错: {str(e)}")
        return False

