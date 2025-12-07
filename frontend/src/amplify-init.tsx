import { Amplify } from "aws-amplify";
import '@aws-amplify/auth';
import config from "../amplify_outputs.json";

console.log("== BEFORE configure ==");
console.log(Amplify.getConfig && Amplify.getConfig());

Amplify.configure(config);

console.log("== AFTER configure ==");
console.log(Amplify.getConfig && Amplify.getConfig());