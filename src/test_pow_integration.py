#!/usr/bin/env python3
"""
测试POW集成的完整数据获取流程
"""

import logging
import sys
from pathlib import Path

# 添加当前目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from data_process import KaitoCrawler
from pow_solver import POWSolver

def setup_test_logging():
    """设置测试日志"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )

def test_pow_solver_standalone():
    """测试POW求解器独立功能"""
    print("\n=== 测试POW求解器独立功能 ===")
    
    solver = POWSolver()
    
    # 测试获取挑战
    print("1. 测试获取挑战...")
    challenge_data = solver.fetch_challenge()
    if challenge_data:
        print(f"✓ 成功获取挑战: {challenge_data}")
        
        # 测试解决挑战
        print("2. 测试解决POW挑战...")
        try:
            nonce, hash_result = solver.solve_pow_challenge(
                challenge_data['challenge'], 
                challenge_data['difficulty']
            )
            print(f"✓ 成功解决挑战: nonce={nonce}, hash={hash_result}")
            
            # 验证哈希结果
            expected_hash = solver.sha256_hash(f"{challenge_data['challenge']}:{nonce}")
            if expected_hash == hash_result:
                print(f"✓ 哈希验证通过")
            else:
                print(f"✗ 哈希验证失败: 期望={expected_hash}, 实际={hash_result}")
                
        except Exception as e:
            print(f"✗ 解决挑战失败: {e}")
            return False
            
    else:
        print("✗ 获取挑战失败")
        return False
    
    # 测试生成完整头部
    print("3. 测试生成POW头部...")
    headers = solver.get_pow_headers()
    if headers:
        print(f"✓ 成功生成POW头部: {headers}")
        required_keys = ['x-challenge', 'x-nonce', 'x-hash']
        if all(key in headers for key in required_keys):
            print("✓ POW头部包含所有必需字段")
        else:
            print(f"✗ POW头部缺少必需字段: {required_keys}")
            return False
    else:
        print("✗ 生成POW头部失败")
        return False
    
    return True

def test_kaito_crawler_integration():
    """测试KaitoCrawler集成POW功能"""
    print("\n=== 测试KaitoCrawler集成POW功能 ===")
    
    try:
        crawler = KaitoCrawler()
        print("✓ 成功创建KaitoCrawler实例")
        
        # 测试单个时间段的数据获取
        print("1. 测试获取24h时间段数据...")
        data = crawler.fetch_data_for_duration("24h")
        
        if data:
            print(f"✓ 成功获取24h数据")
            if "resultWithTicker" in data and data["resultWithTicker"]:
                print(f"✓ 数据包含{len(data['resultWithTicker'])}条记录")
                
                # 打印前几条记录的基本信息
                print("数据样例:")
                for i, record in enumerate(data["resultWithTicker"][:3]):
                    if "token" in record:
                        token_info = record["token"]
                        print(f"  {i+1}. {token_info.get('symbol', 'Unknown')} - {token_info.get('name', 'Unknown')}")
                
                return True
            else:
                print("✗ 数据不包含resultWithTicker字段或为空")
                return False
        else:
            print("✗ 获取24h数据失败")
            return False
            
    except Exception as e:
        print(f"✗ KaitoCrawler测试失败: {e}")
        return False

def test_full_workflow():
    """测试完整的数据获取工作流程"""
    print("\n=== 测试完整数据获取工作流程 ===")
    
    try:
        crawler = KaitoCrawler()
        
        # 测试获取少量时间段的数据
        test_durations = ["24h", "7d"]
        print(f"测试获取时间段: {test_durations}")
        
        all_data = {}
        for duration in test_durations:
            print(f"正在获取{duration}数据...")
            data = crawler.fetch_data_for_duration(duration)
            if data:
                all_data[duration] = data
                print(f"✓ 成功获取{duration}数据")
            else:
                print(f"✗ 获取{duration}数据失败")
                return False
        
        if all_data:
            print(f"✓ 成功获取所有测试时间段数据: {list(all_data.keys())}")
            
            # 测试保存数据
            print("测试保存数据...")
            saved_files = crawler.save_data(all_data)
            if saved_files:
                print(f"✓ 成功保存数据到文件: {saved_files}")
                return True
            else:
                print("✗ 保存数据失败")
                return False
        else:
            print("✗ 未获取到任何数据")
            return False
            
    except Exception as e:
        print(f"✗ 完整工作流程测试失败: {e}")
        return False

def main():
    """主测试函数"""
    setup_test_logging()
    
    print("开始测试POW集成的数据获取流程")
    print("=" * 50)
    
    # 测试1: POW求解器独立功能
    test1_result = test_pow_solver_standalone()
    
    # 测试2: KaitoCrawler集成功能
    test2_result = test_kaito_crawler_integration()
    
    # 测试3: 完整工作流程
    test3_result = test_full_workflow()
    
    # 汇总结果
    print("\n=== 测试结果汇总 ===")
    print(f"POW求解器独立测试: {'✓ 通过' if test1_result else '✗ 失败'}")
    print(f"KaitoCrawler集成测试: {'✓ 通过' if test2_result else '✗ 失败'}")
    print(f"完整工作流程测试: {'✓ 通过' if test3_result else '✗ 失败'}")
    
    if all([test1_result, test2_result, test3_result]):
        print("\n🎉 所有测试通过！POW集成成功！")
        return 0
    else:
        print("\n❌ 存在测试失败，请检查日志")
        return 1

if __name__ == "__main__":
    exit(main())
