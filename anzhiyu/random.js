var posts=["2026/03/20/Hello-World-我的博客诞生了/","2026/03/20/OpenClaw-源码深度拆解/","2026/03/20/OpenClaw-源码深度拆解：从零构建你的-AI-助手框架/","2026/03/20/hello-world/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };