---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Kislate 的奇思妙想"
  text: "记录那些迟早会忘记的事"
  tagline: "偶尔更新，经常拖延，永远挖坑"
  actions:
    - theme: brand
      text: 开始探索
      link: /vitepress-guide
    - theme: alt
      text: 查看示例
      link: /markdown-examples

features:
  - icon: 🚀
    title: "优质代码"
    details: "指能跑起来不报错的代码"
  - icon: 🔍
    title: "console.log('Debug')"
    details: "我的开发必备技能"
  - icon: 🏆
    title: "Works on My Machine™"
    details: "终极测试方案"
  - icon: 🐞
    title: "丰富经验"
    details: "在制造bug方面确实很丰富"
---

<div class="random-button">
  <button id="randomizeButton" title="换个风格">🎲</button>
</div>

<script setup>
import { onMounted, ref } from 'vue';

// 不同风格的标题和文案集合
const heroVariants = [
  {
    name: "Kislate 的奇思妙想",
    text: "记录那些迟早会忘记的事",
    tagline: "偶尔更新，经常拖延，永远挖坑"
  },
  {
    name: "Bug 生产车间",
    text: "Powered by Coffee & Bugs",
    tagline: "这里什么都有，除了有用的东西"
  },
  {
    name: "404 Brain Not Found",
    text: "一个前端开发者的碎碎念",
    tagline: "Where bugs come to life"
  },
  {
    name: "代码与咖啡的日常",
    text: "Documenting my coding misadventures",
    tagline: "本网站最佳浏览方式：不要浏览"
  }
];

const featureVariants = [
  [
    { icon: '🚀', title: "优质代码", details: "指能跑起来不报错的代码" },
    { icon: '⏰', title: "高效学习", details: "5分钟学习，2小时刷梗图" },
    { icon: '🔮', title: "前沿技术", details: "指我昨天刚听说的那种" },
    { icon: '🐞', title: "丰富经验", details: "在制造bug方面确实很丰富" }
  ],
  [
    { icon: '💻', title: "console.log('Hello World')", details: "每个项目都从这里开始" },
    { icon: '📋', title: "CTRL+C / CTRL+V", details: "核心开发技能" },
    { icon: '🔍', title: "Google Driven Development", details: "我的开发方法论" },
    { icon: '🏆', title: "Works on My Machine™", details: "终极测试方案" }
  ],
  [
    { icon: '📝', title: "速查手册", details: "那些总记不住的命令和配置" },
    { icon: '🕳️', title: "踩坑记录", details: "前人踩坑，后人乘凉" },
    { icon: '🧩', title: "代码片段", details: "复制粘贴就能用的实用代码" },
    { icon: '📚', title: "学习笔记", details: "浓缩的知识精华" }
  ],
  [
    { icon: '🔮', title: "禁忌的知识库", details: "凡人无法理解的代码奥秘" },
    { icon: '🌀', title: "无限回廊", details: "进入后就找不到出口的文档迷宫" },
    { icon: '🚪', title: "真理之门", details: "代价是无数个debug的夜晚" },
    { icon: '👾', title: "终焉之bug", details: "永远无法被完全消灭" }
  ]
];

// 随机函数
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// 随机化内容的函数
function randomizeContent() {
  // 随机选择索引
  const randomHeroIndex = getRandomInt(heroVariants.length);
  const randomFeaturesIndex = getRandomInt(featureVariants.length);
  
  // 获取DOM元素
  const heroNameEl = document.querySelector('.VPHero .name');
  const heroTextEl = document.querySelector('.VPHero .text');
  const heroTaglineEl = document.querySelector('.VPHero .tagline');
  
  // 添加淡出效果
  if(heroNameEl && heroTextEl && heroTaglineEl) {
    [heroNameEl, heroTextEl, heroTaglineEl].forEach(el => {
      el.style.opacity = '0';
    });
    
    // 短暂延迟后更新内容并淡入
    setTimeout(() => {
      heroNameEl.textContent = heroVariants[randomHeroIndex].name;
      heroTextEl.textContent = heroVariants[randomHeroIndex].text;
      heroTaglineEl.textContent = heroVariants[randomHeroIndex].tagline;
      
      [heroNameEl, heroTextEl, heroTaglineEl].forEach(el => {
        el.style.opacity = '1';
      });
    }, 300);
  }
  
  // 更新Features区域
  const featureTitles = document.querySelectorAll('.VPFeature .title');
  const featureDetails = document.querySelectorAll('.VPFeature .details');
  
  if(featureTitles.length > 0 && featureDetails.length > 0) {
    // 添加淡出效果
    [...featureTitles, ...featureDetails].forEach(el => {
      el.style.opacity = '0';
    });
    
    // 短暂延迟后更新内容并淡入
    setTimeout(() => {
      featureTitles.forEach((title, i) => {
        if(i < featureVariants[randomFeaturesIndex].length) {
          title.textContent = featureVariants[randomFeaturesIndex][i].title;
        }
      });
      
      featureDetails.forEach((detail, i) => {
        if(i < featureVariants[randomFeaturesIndex].length) {
          detail.textContent = featureVariants[randomFeaturesIndex][i].details;
        }
      });
      
      [...featureTitles, ...featureDetails].forEach(el => {
        el.style.opacity = '1';
      });
    }, 300);
  }
}

onMounted(() => {
  // 检查是否为客户端渲染
  if (typeof window !== 'undefined') {
    // 初始化时随机选择内容
    randomizeContent();
    
    // 为按钮绑定事件
    const button = document.getElementById('randomizeButton');
    if (button) {
      button.addEventListener('click', () => {
        randomizeContent();
        
        // 添加按钮动画效果
        button.classList.add('spin');
        setTimeout(() => {
          button.classList.remove('spin');
        }, 500);
      });
    }
  }
});
</script>

<style>
.random-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 100;
}

.random-button button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(145deg, #bd34fe, #41d1ff);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.random-button button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.random-button button.spin {
  animation: spin 0.5s ease-in-out;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 添加淡入淡出效果 */
.VPHero .name,
.VPHero .text,
.VPHero .tagline,
.VPFeature .title,
.VPFeature .details {
  transition: opacity 0.3s ease;
}
</style>

