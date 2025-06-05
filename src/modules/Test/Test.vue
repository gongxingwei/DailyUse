<template>
  <div class="test-container">
    <div class="line">
      <div class="left-item">
        riqi
      </div>
      <div class="right-item">
        zheshiyouceneirong 
      </div>
    </div>
  </div>
</template>

<script>
import { inject, ref, computed } from 'vue';

</script>

<style scoped>
.test-container {
  width: 100%;
  height: 100px;

  background-color: rgb(147, 161, 161);
}
.line {
  display: inline-flex;
  width: 100%;
  height: 100%;
}
.left-item {
  float: left;
  background-color: rgba(196, 155, 155, 0.1);
  padding: 10px;
}
.right-item {

  background-color: rgba(77, 77, 156, 0.1);
  padding: 10px;
}
</style>