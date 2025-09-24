<template>
  <div>{{Name}}</div>
</template>

<script lang="ts">
class Test {
  Name:string = "";
}
export default {
  data(): Test {
    return {
      Name: "abcd"
    }
  }
}
</script>
