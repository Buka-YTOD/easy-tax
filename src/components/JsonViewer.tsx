interface JsonViewerProps {
  data: unknown;
}

export function JsonViewer({ data }: JsonViewerProps) {
  if (!data) return null;

  return (
    <pre className="bg-muted rounded-lg p-4 overflow-auto text-sm font-mono max-h-96 text-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
