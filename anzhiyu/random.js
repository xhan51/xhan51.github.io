var posts=["2026/03/25/esp32-robot-dog-assembly-guide/","2026/03/23/esp32-robot-dog/","2026/03/24/hello-world/","2026/03/24/openclaw-ai-novel-monetization/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };