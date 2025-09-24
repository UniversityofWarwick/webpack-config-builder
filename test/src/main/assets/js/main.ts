import hello from './hello';
import { createApp } from 'vue';
import Test from './test.vue';

console.log(hello);
createApp(Test).mount('#test');
