import os
import re
import glob
from datetime import datetime

def update_vue_import_path():
    # 查找最新的数据文件
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    data_files = glob.glob(os.path.join(data_dir, "kaito_data_*.json"))

    if not data_files:
        print("No data files found!")
        return False

    # 获取最新的数据文件名
    latest_file = max(data_files, key=os.path.getmtime)
    latest_filename = os.path.basename(latest_file)
    print(f"Latest data file: {latest_filename}")

    # 获取当前日期作为更新时间
    current_date = datetime.now().strftime("%Y-%m-%d")

    # 读取 index.vue 文件
    vue_file_path = os.path.join(os.path.dirname(__file__), "..", "index.vue")

    if not os.path.exists(vue_file_path):
        print(f"Vue file not found at: {vue_file_path}")
        # 尝试其他可能的位置
        alternative_path = os.path.join(os.path.dirname(__file__), "pages", "index.vue")
        if os.path.exists(alternative_path):
            vue_file_path = alternative_path
            print(f"Found Vue file at alternative location: {vue_file_path}")
        else:
            print("Could not find index.vue file")
            return False

    with open(vue_file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # 检查文件内容是否包含动态导入API数据的代码
    if "async function fetchData()" in content:
        print("Vue file already uses dynamic API fetching, no need to update import path.")
        return False

    # 检查是否已经从Kaito API获取数据
    if "API_URL = 'https://hub.kaito.ai/api/v1/gateway/ai" in content:
        print("Vue file already configured to use Kaito API, no need to update.")
        return False

    # 记录更新内容
    changes_made = []

    # 使用正则表达式替换导入路径
    updated_content = re.sub(
        r'import (foresightData|tickerData) from \'\.\.\/data\/(foresight|kaito)_data_\d+\.json\'',
        f"import tickerData from '../data/{latest_filename}'",
        content
    )

    if content != updated_content:
        changes_made.append(f"Updated import path to: '../data/{latest_filename}'")

    # 更新时间戳（如果有）
    timestamp_match = re.search(r'<div[^>]*>([^<]*更新时间：[^<]*)<\/div>', updated_content)
    if timestamp_match:
        updated_timestamp = f'<div class="text-xs text-gray-500">更新时间：{current_date}</div>'
        updated_content = re.sub(
            r'<div[^>]*>([^<]*更新时间：[^<]*)<\/div>',
            updated_timestamp,
            updated_content
        )
        changes_made.append(f"Updated timestamp to: '{current_date}'")

    # 检查是否有变更
    if content == updated_content:
        print("No changes needed in vue file.")
        return False

    # 写回文件
    with open(vue_file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

    for change in changes_made:
        print(change)

    return True

if __name__ == "__main__":
    update_vue_import_path()
