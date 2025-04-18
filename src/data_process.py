import requests
import json
import zlib
import base64
import time
from datetime import datetime
import os
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import gzip
import shutil
from typing import Optional, List, Dict

class KaitoCrawler:
    def __init__(self):
        self.base_url = "https://hub.kaito.ai/api/v1/gateway/ai"
        self.durations = ["24h", "48h", "7d", "30d", "3m", "6m", "12m"]

        # 基础目录
        self.base_dir = Path(__file__).parent

        # 数据目录结构
        self.public_dir = self.base_dir.parent / "public"
        self.data_dir = self.public_dir / "data"
        self.log_dir = self.base_dir / "log"

        # 创建必需的目录
        self.data_dir.mkdir(exist_ok=True, parents=True)
        self.log_dir.mkdir(exist_ok=True)

        # 设置日志
        self.setup_logging()

    def setup_logging(self):
        """配置日志系统"""
        # 确保日志目录存在
        self.log_dir.mkdir(exist_ok=True)

        # 生成日志文件路径
        log_file = self.log_dir / f"crawler_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

        # 配置日志
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def fetch_data_for_duration(self, duration):
        """获取特定时间段的数据"""
        try:
            self.logger.info(f"开始从Kaito API获取{duration}时间段的数据...")

            # 构建请求参数
            params = {
                "nft": "false",
                "ex_official": "false",
                "weighted": "false",
                "duration": duration,
                "sort_type": "desc",
                "type": "heatmap",
                "pre_tge": "true"
            }

            # 准备请求体
            payload = {
                "path": "/api/yapper/dashboard_ticker_mindshare",
                "method": "GET",
                "params": params,
                "body": {}
            }

            headers = {
                "Content-Type": "application/json"
            }

            # 直接发送请求到基础URL，不附加参数
            response = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=30
            )

            # 调试输出
            self.logger.debug(f"API状态码: {response.status_code}")
            self.logger.debug(f"API响应头: {response.headers}")

            # 接受200和201状态码
            if response.status_code not in [200, 201]:
                self.logger.error(f"API请求失败: HTTP状态码 {response.status_code}")
                return None

            try:
                data = response.json()
            except Exception as e:
                self.logger.error(f"解析JSON响应失败: {e}")
                # 记录响应内容以便调试
                self.logger.debug(f"响应内容: {response.text[:200]}...")
                return None

            if "resultWithTicker" not in data or not data["resultWithTicker"]:
                self.logger.error(f"{duration}时间段API返回数据不包含resultWithTicker字段或为空")
                return None

            self.logger.info(f"成功获取{duration}时间段数据，共{len(data['resultWithTicker'])}条记录")
            return data

        except requests.RequestException as e:
            self.logger.error(f"请求异常: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"获取{duration}时间段数据时出错: {str(e)}")
            return None

    def fetch_all_durations(self):
        """获取所有时间段的数据"""
        all_data = {}

        # 为了避免并发请求可能导致的问题，改为串行请求
        for duration in self.durations:
            try:
                self.logger.info(f"开始获取{duration}时间段数据")
                data = self.fetch_data_for_duration(duration)
                if data:
                    all_data[duration] = data
                    self.logger.info(f"成功添加{duration}时间段数据")
                else:
                    self.logger.error(f"未能获取{duration}时间段数据")

                # 添加短暂延迟，避免API限流
                time.sleep(1)
            except Exception as e:
                self.logger.error(f"处理{duration}时间段数据时异常: {e}")

        return all_data

    def save_data(self, all_data):
        """保存所有时间段的数据到public/data目录"""
        try:
            # 确保目录存在
            self.data_dir.mkdir(exist_ok=True, parents=True)

            # 生成日期时间戳
            timestamp = datetime.now().strftime("%Y%m%d")

            # 保存每个duration的数据到单独的文件
            saved_files = []
            for duration, data in all_data.items():
                # 生成文件名 kaito_data_20250418_24h.json
                data_file = self.data_dir / f"kaito_data_{timestamp}_{duration}.json"

                # 保存数据
                with open(data_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self.logger.info(f"数据保存成功: {data_file}")
                saved_files.append(str(data_file))


            # 清理旧数据文件(保留最近7天)
            # self.clean_old_files(7)

            return saved_files

        except Exception as e:
            self.logger.error(f"保存数据失败: {e}")
            raise

    def clean_old_files(self, keep_days: int) -> None:
        """清理旧的数据文件"""
        try:
            current_time = time.time()

            for file_path in self.data_dir.glob("kaito_data_*.json"):
                if file_path.is_file():
                    file_time = file_path.stat().st_mtime
                    if (current_time - file_time) > (keep_days * 24 * 3600):
                        file_path.unlink()
                        self.logger.info(f"已删除旧数据文件: {file_path.name}")

        except Exception as e:
            self.logger.error(f"清理旧文件失败: {e}")

    def run(self):
        """运行爬虫"""
        try:
            self.logger.info("开始获取所有时间段的Kaito数据...")
            all_data = self.fetch_all_durations()

            if all_data and len(all_data) > 0:
                data_files = self.save_data(all_data)
                self.logger.info(f"所有时间段数据获取完成并保存到: {', '.join(data_files)}")
                return data_files
            else:
                self.logger.error("未获取到任何时间段的数据")
                return None

        except Exception as e:
            self.logger.error(f"程序异常退出: {str(e)}")
            raise

def main():
    try:
        crawler = KaitoCrawler()
        data_files = crawler.run()
        if data_files:
            print(f"数据文件: {', '.join(data_files)}")
            return data_files
        else:
            logging.error("数据获取失败")
            return None
    except Exception as e:
        logging.error(f"程序异常退出: {e}")
        raise

if __name__ == "__main__":
    main()
