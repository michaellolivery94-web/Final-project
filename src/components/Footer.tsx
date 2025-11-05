export const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-2 px-4 bg-background/80 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto flex justify-center items-center">
        <p className="text-xs text-muted-foreground/70 font-medium">
          Created by Trevor Ingari{' '}
          <span className="inline-block text-[0.6rem] align-super">™</span>
        </p>
      </div>
    </footer>
  );
};
