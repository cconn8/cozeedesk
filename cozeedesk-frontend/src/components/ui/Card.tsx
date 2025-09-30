// Simple Card Components - No advanced patterns

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}


interface CardIconProps { 
  children : React.ReactNode;
  className?: string;
}

export function Card(props: CardProps) {
  const { children, className = '' } = props;
  const cardStyles = `bg-white overflow-hidden shadow rounded-lg ${className}`;
  
  return (
    <div className={cardStyles}>
        {children}
    </div>
  );
}

export function CardContent(props: CardContentProps) {
  const { children, className = '' } = props;
  const contentStyles = `px-6 py-4 ${className}`;
  
  return (
    <div className={contentStyles}>
      {children}
    </div>
  );
}


export function CardIcon(props: CardIconProps) {
  const {children, className = ''} = props;
  const iconStyles = `flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${className}`;

  return (
    <div className={`${iconStyles}`}>
      <div className="flex-shrink-0">
        <span className="text-white text-sm font-medium">
          {children}
        </span>
      </div>
    </div>
  )

}