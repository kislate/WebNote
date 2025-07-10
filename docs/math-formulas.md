# LaTeX数学公式示例笔记

> 本文档展示了在VitePress中使用LaTeX数学公式的各种语法和效果，可用于测试公式渲染效果。

## 基础数学公式

### 行内公式

在文本中插入行内公式：爱因斯坦质能方程 $E=mc^2$ 表明质量与能量之间的关系。

牛顿第二定律可以表述为 $F=ma$，其中 $F$ 是力，$m$ 是质量，$a$ 是加速度。

黄金分割比约为 $\varphi = \frac{1 + \sqrt{5}}{2} \approx 1.618$。

### 块级公式

以下是勾股定理的公式表示：

$$a^2 + b^2 = c^2$$

二次方程的求根公式：

$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

欧拉公式，被誉为数学最美丽的公式之一：

$$e^{i\pi} + 1 = 0$$

## 高级数学表达式

### 求和与积分

求和符号示例：

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

无穷级数：

$$\sum_{n=0}^{\infty} \frac{1}{n!} = e$$

定积分：

$$\int_{a}^{b} f(x) \, dx$$

多重积分：

$$\iint_D f(x,y) \, dx \, dy = \int_a^b \int_{g_1(x)}^{g_2(x)} f(x,y) \, dy \, dx$$

### 分数与根式

嵌套分数：

$$\frac{\frac{1}{x}+\frac{1}{y}}{\frac{1}{x^2}+\frac{1}{y^2}}$$

连分数：

$$x = a_0 + \cfrac{1}{a_1 + \cfrac{1}{a_2 + \cfrac{1}{a_3 + \cdots}}}$$

根式：

$$\sqrt[n]{x} = x^{1/n}$$

## 矩阵与行列式

### 矩阵

2×2矩阵：

$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}$$

3×3矩阵：

$$\begin{bmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{bmatrix}$$

增广矩阵：

$$\begin{pmatrix}
1 & 2 & 3 & | & 4 \\
5 & 6 & 7 & | & 8
\end{pmatrix}$$

### 行列式

2阶行列式：

$$\begin{vmatrix} 
a & b \\
c & d
\end{vmatrix} = ad - bc$$

3阶行列式：

$$\begin{vmatrix} 
a & b & c \\
d & e & f \\
g & h & i
\end{vmatrix} = a\begin{vmatrix} e & f \\ h & i \end{vmatrix} - b\begin{vmatrix} d & f \\ g & i \end{vmatrix} + c\begin{vmatrix} d & e \\ g & h \end{vmatrix}$$

## 微积分与极限

导数定义：

$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

偏导数：

$$\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h, y) - f(x, y)}{h}$$

链式法则：

$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}$$

泰勒展开式：

$$f(x) = f(a) + f'(a)(x-a) + \frac{f''(a)}{2!}(x-a)^2 + \frac{f'''(a)}{3!}(x-a)^3 + \cdots$$

## 线性代数

### 向量

向量点积：

$$\vec{a} \cdot \vec{b} = |a||b|\cos\theta$$

向量叉积：

$$\vec{a} \times \vec{b} = |a||b|\sin\theta\hat{n}$$

### 特征值和特征向量

特征方程：

$$\det(A - \lambda I) = 0$$

## 统计与概率

### 概率分布

正态分布的概率密度函数：

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$

二项分布的概率质量函数：

$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}$$

### 统计量

样本均值：

$$\bar{x} = \frac{1}{n}\sum_{i=1}^{n}x_i$$

样本方差：

$$s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2$$

## 物理学公式

### 经典力学

牛顿万有引力定律：

$$F = G\frac{m_1 m_2}{r^2}$$

动能：

$$E_k = \frac{1}{2}mv^2$$

### 相对论

质能等价：

$$E = mc^2$$

洛伦兹变换：

$$\begin{cases}
t' = \gamma \left(t - \frac{vx}{c^2}\right) \\
x' = \gamma (x - vt) \\
y' = y \\
z' = z
\end{cases}$$

其中：

$$\gamma = \frac{1}{\sqrt{1-\frac{v^2}{c^2}}}$$

## 化学公式

### 化学平衡常数

$$K_c = \frac{[C]^c[D]^d}{[A]^a[B]^b}$$

### 阿伦尼乌斯方程

$$k = A e^{-\frac{E_a}{RT}}$$

## 复杂数学符号

### 集合论

集合关系：

$$A \subset B \iff \forall x \in A, x \in B$$

集合运算：

$$A \cup B = \{x | x \in A \text{ or } x \in B\}$$

$$A \cap B = \{x | x \in A \text{ and } x \in B\}$$

### 逻辑符号

逻辑蕴含：

$$p \implies q$$

逻辑等价：

$$p \iff q$$

量词：

$$\forall x \in X, \exists y \in Y: P(x,y)$$

## LaTeX环境

### 对齐方程组

使用`align`环境对齐多个方程：

$$\begin{align}
y &= (x+1)^2 \\
&= x^2 + 2x + 1
\end{align}$$

### 分段函数

使用`cases`环境表示分段函数：

$$f(x) = 
\begin{cases}
x^2, & \text{if } x \geq 0 \\
-x^2, & \text{if } x < 0
\end{cases}$$

## 物理常数与单位

玻尔兹曼常数：

$$k_B = 1.380649 \times 10^{-23} \text{ J/K}$$

普朗克常数：

$$h = 6.62607015 \times 10^{-34} \text{ J}\cdot\text{s}$$

## 希腊字母与特殊符号

常用希腊字母：
$\alpha, \beta, \gamma, \delta, \epsilon, \zeta, \eta, \theta, \iota, \kappa, \lambda, \mu, \nu, \xi, \omicron, \pi, \rho, \sigma, \tau, \upsilon, \phi, \chi, \psi, \omega$

大写希腊字母：
$\Gamma, \Delta, \Theta, \Lambda, \Xi, \Pi, \Sigma, \Upsilon, \Phi, \Psi, \Omega$

特殊符号：
$\nabla, \partial, \infty, \forall, \exists, \nexists, \in, \notin, \subset, \supset, \emptyset, \varnothing$

## 总结

以上是在VitePress中使用LaTeX数学公式的多种语法示例，涵盖了从简单方程到复杂数学表达式的各种情况。如果这些公式能够正常渲染，说明VitePress对数学公式的支持是完善的。
