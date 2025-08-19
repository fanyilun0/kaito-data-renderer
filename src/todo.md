解决KAITO添加到防机器人POW证明

现状：
请求一个url出现了这样的response
{"code":"401","message":"Invalid proof of work challenge response"}


1. 挑战： https://hub.kaito.ai/api/v1/anti-crawling/challenge
response：
{"challenge":"kaito_ai_challenge_1755572922220_l39204g6","difficulty":4.3}

2. 解决思路：

以下是页面F12代码的解决方案
class p {

static getInstance() {

return p.instance || (p.instance = new p),

p.instance

}

async fetchChallenge(e) {

try {

let e = await _.get("/anti-crawling/challenge");

if (200 !== e.status)

throw Error("Failed to fetch challenge: ".concat(e.statusText));

return e.data

} catch (e) {

throw console.warn("Failed to fetch challenge from server:", e),

e

}

}

async getPOWHeaders(e) {

let t = await this.fetchChallenge(e)

, {nonce: a, hash: n} = await g(t.challenge, t.difficulty);

return {

"x-challenge": t.challenge,

"x-nonce": a.toString(),

"x-hash": n

}

}

}


2. POW函数：
g函数: 
async function g(e, t) {
            let a = 0
              , n = Math.floor(t)
              , l = t - n
              , r = Math.ceil(16 * (1 - l)) % 16
              , s = "0".repeat(n);
            for (; ; ) {
                let t = "".concat(e, ":").concat(a)
                  , i = await h(t);
                if (i.startsWith(s) && (0 === l || parseInt(i.charAt(n), 16) < r))
                    return {
                        nonce: a,
                        hash: i
                    };
                a++
            }
        }

3. 结果添加相应的请求头来实现
举例：
X-Challenge kaito_ai_challenge_1755573070281_x87p7hsx
X-Hash 000d2ecd84e9ce1375431a45f0b13d39e690c50a9bace8f5a7416e48fca0f3dc
X-Nonce 3086

4. 添加一个 pow resolve python 文件来专门处理请求前处理POW并添加请求头正确获取内容