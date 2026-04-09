import { extensions } from "@wix/astro/builders";

export default extensions.embeddedScript({
  id: "fb36222c-a004-4b77-b7ab-fb09aa5c0c15",
  name: "contactform",
  placement: "BODY_END",
  scriptType: "FUNCTIONAL",
  source: "./extensions/site/embedded-scripts/contactform/contactform.html",
});
