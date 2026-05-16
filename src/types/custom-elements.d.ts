declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': {
      'agent-id'?: string;
    } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
