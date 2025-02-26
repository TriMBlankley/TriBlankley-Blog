declare module '*.txt' {
  const content: string
  export default content
}

declare module '*.svg?component' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

declare module '*.svg?react' {
  import React from 'react';
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg?url' {
  const url: string;
  export default url;
}

declare module '*.svg?raw' {
  const raw: string;
  export default raw;
}