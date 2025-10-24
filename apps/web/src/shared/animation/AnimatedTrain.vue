<template>
  <div class="train-container">
    <div class="sun"></div>
    <div class="train">
      <div class="locomotive">
        <div class="square1" data-letter="Daily"></div>
        <div class="square2" data-letter="Use"></div>
        <div class="engine">
          <div class="engine-light"></div>
        </div>
      </div>
      <div class="wheels">
        <div class="wheel" data-letter="d"></div>
        <div class="wheel" data-letter="a"></div>
        <div class="wheel" data-letter="i"></div>
        <div class="wheel" data-letter="l"></div>
        <div class="wheel" data-letter="y"></div>
        <div class="wheel" data-letter="u"></div>
        <div class="wheel" data-letter="s"></div>
        <div class="wheel" data-letter="e"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.train-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #1a2a30 0%, #2d2f30 100%);
}
.train {
  position: absolute;
  bottom: 50px;
  left: -350px;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  animation: moveTrain 10s linear infinite;
}
.locomotive {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.square1 {
  position: relative;
  width: 160px;
  height: 60px;
  background: rgb(var(--v-theme-accent));
  border-radius: 8px;
}
.square1::before {
  content: attr(data-letter);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--v-theme-on-surface));
  font-weight: bold;
  font-size: 24px;
}
.square2 {
  position: relative;
  width: 100px;
  height: 60px;
  background: rgb(var(--v-theme-secondary));
  border-radius: 8px;
}
.square2::before {
  content: attr(data-letter);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--v-theme-on-surface));
  font-weight: bold;
  font-size: 24px;
}
.engine {
  position: relative;
  width: 80px;
  height: 60px;
  background: rgb(var(--v-theme-primary));
  border-radius: 8px;
  clip-path: polygon(0 0, 50% 0, 100% 60%, 100% 100%, 0 100%);
}
.engine-light {
  position: absolute;
  width: 15px;
  height: 15px;
  background: #ffd700;
  border-radius: 50%;
  right: 0;
  top: 70%;
  transform: translateY(-50%);
  box-shadow: 0 0 10px #ffd700;
  animation: glowLight 1s ease-in-out infinite alternate;
}
.wheels {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}
.wheel {
  width: 30px;
  height: 30px;
  background: #9c27b0;
  border-radius: 50%;
  position: relative;
  animation: rotateWheel 2s linear infinite;
}
.wheel::before {
  content: attr(data-letter);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgb(var(--v-theme-on-surface));
  font-weight: bold;
  font-size: 16px;
}
@keyframes moveTrain {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(100vw + 350px));
  }
}
@keyframes rotateWheel {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.sun {
  position: absolute;
  top: 20px;
  left: -350px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff176, #ffd700);
  box-shadow:
    0 0 30px #ffd700,
    0 0 60px rgba(255, 215, 0, 0.4);
  z-index: 0;
  animation: sunMove 10s linear infinite;
}
.sun::before {
  content: '';
  position: absolute;
  top: -15px;
  left: -15px;
  right: -15px;
  bottom: -15px;
  background: transparent;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.3);
  animation: sunRays 4s linear infinite;
}
@keyframes sunMove {
  0% {
    transform: translate(0, 20px);
  }
  25% {
    transform: translate(calc(25vw + 350px), -30px);
  }
  50% {
    transform: translate(calc(50vw + 350px), -50px);
  }
  75% {
    transform: translate(calc(75vw + 350px), -30px);
  }
  100% {
    transform: translate(calc(100vw + 350px), 20px);
  }
}
@keyframes sunRays {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes sunGlow {
  from {
    box-shadow:
      0 0 30px #ffd700,
      0 0 60px rgba(255, 215, 0, 0.4);
  }
  to {
    box-shadow:
      0 0 40px #ffd700,
      0 0 80px rgba(255, 215, 0, 0.6);
  }
}
</style>
