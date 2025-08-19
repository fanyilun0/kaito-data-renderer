import hashlib
import requests
import logging
from typing import Dict, Tuple, Optional
import asyncio
import time

class POWSolver:
    """Kaito POW证明求解器"""
    
    def __init__(self, base_url: str = "https://hub.kaito.ai"):
        self.base_url = base_url.rstrip('/')
        self.challenge_url = f"{self.base_url}/api/v1/anti-crawling/challenge"
        self.logger = logging.getLogger(__name__)
    
    def sha256_hash(self, data: str) -> str:
        """计算SHA256哈希值"""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def solve_pow_challenge(self, challenge: str, difficulty: float) -> Tuple[int, str]:
        """
        解决POW挑战
        
        Args:
            challenge: 挑战字符串
            difficulty: 难度值
            
        Returns:
            Tuple[nonce, hash]: nonce值和对应的哈希值
        """
        self.logger.info(f"开始解决POW挑战: challenge={challenge}, difficulty={difficulty}")
        
        nonce = 0
        # 计算整数部分和小数部分
        n = int(difficulty)  # 整数部分
        l = difficulty - n   # 小数部分
        r = (16 * (1 - l)) % 16  # 计算阈值
        r = int(r)
        
        # 生成前缀零字符串
        prefix_zeros = "0" * n
        
        self.logger.debug(f"POW参数: n={n}, l={l}, r={r}, prefix_zeros='{prefix_zeros}'")
        
        start_time = time.time()
        
        while True:
            # 构造要哈希的字符串: challenge:nonce
            hash_input = f"{challenge}:{nonce}"
            
            # 计算SHA256哈希
            hash_result = self.sha256_hash(hash_input)
            
            # 检查是否满足难度要求
            if hash_result.startswith(prefix_zeros):
                # 如果没有小数部分，直接满足条件
                if l == 0:
                    elapsed = time.time() - start_time
                    self.logger.info(f"POW挑战解决成功! nonce={nonce}, hash={hash_result}, 耗时={elapsed:.2f}秒")
                    return nonce, hash_result
                
                # 检查第n位字符是否小于阈值r
                if len(hash_result) > n:
                    nth_char_value = int(hash_result[n], 16)
                    if nth_char_value < r:
                        elapsed = time.time() - start_time
                        self.logger.info(f"POW挑战解决成功! nonce={nonce}, hash={hash_result}, 耗时={elapsed:.2f}秒")
                        return nonce, hash_result
            
            nonce += 1
            
            # 每10000次尝试输出一次进度
            if nonce % 10000 == 0:
                elapsed = time.time() - start_time
                self.logger.debug(f"POW进度: 尝试了{nonce}次, 耗时={elapsed:.2f}秒")
    
    def fetch_challenge(self) -> Optional[Dict]:
        """
        获取POW挑战参数
        
        Returns:
            Dict: 包含challenge和difficulty的字典，失败时返回None
        """
        try:
            self.logger.info("正在获取POW挑战参数...")
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                self.challenge_url,
                headers=headers,
                timeout=10
            )
            
            self.logger.debug(f"挑战请求状态码: {response.status_code}")
            self.logger.debug(f"挑战请求响应: {response.text}")
            
            if response.status_code != 200:
                self.logger.error(f"获取挑战失败: HTTP {response.status_code}")
                return None
            
            challenge_data = response.json()
            
            if 'challenge' not in challenge_data or 'difficulty' not in challenge_data:
                self.logger.error(f"挑战响应格式错误: {challenge_data}")
                return None
            
            self.logger.info(f"成功获取挑战: {challenge_data}")
            return challenge_data
            
        except requests.RequestException as e:
            self.logger.error(f"请求挑战时网络错误: {e}")
            return None
        except Exception as e:
            self.logger.error(f"获取挑战时发生错误: {e}")
            return None
    
    def get_pow_headers(self) -> Optional[Dict[str, str]]:
        """
        获取POW验证所需的请求头
        
        Returns:
            Dict: 包含x-challenge, x-nonce, x-hash的字典，失败时返回None
        """
        try:
            # 1. 获取挑战参数
            challenge_data = self.fetch_challenge()
            if not challenge_data:
                return None
            
            challenge = challenge_data['challenge']
            difficulty = challenge_data['difficulty']
            
            # 2. 解决POW挑战
            nonce, hash_result = self.solve_pow_challenge(challenge, difficulty)
            
            # 3. 构造请求头
            pow_headers = {
                "x-challenge": challenge,
                "x-nonce": str(nonce),
                "x-hash": hash_result
            }
            
            self.logger.info(f"POW头部生成成功: {pow_headers}")
            return pow_headers
            
        except Exception as e:
            self.logger.error(f"生成POW头部时发生错误: {e}")
            return None

# 测试函数
def test_pow_solver():
    """测试POW求解器"""
    logging.basicConfig(level=logging.DEBUG)
    
    solver = POWSolver()
    
    # 测试获取挑战
    challenge_data = solver.fetch_challenge()
    if challenge_data:
        print(f"挑战数据: {challenge_data}")
        
        # 测试解决挑战
        nonce, hash_result = solver.solve_pow_challenge(
            challenge_data['challenge'], 
            challenge_data['difficulty']
        )
        print(f"解决结果: nonce={nonce}, hash={hash_result}")
        
        # 测试生成头部
        headers = solver.get_pow_headers()
        if headers:
            print(f"POW头部: {headers}")
        else:
            print("生成POW头部失败")
    else:
        print("获取挑战失败")

if __name__ == "__main__":
    test_pow_solver()
