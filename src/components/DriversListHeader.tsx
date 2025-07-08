
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DriversListHeaderProps {
  onBack: () => void;
  driverCount: number;
}

const DriversListHeader = ({ onBack, driverCount }: DriversListHeaderProps) => {
  return (
    <div className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Motoristas Online</h1>
          <p className="text-sm text-gray-600">
            {driverCount} motorista{driverCount !== 1 ? 's' : ''} disponível{driverCount !== 1 ? 'eis' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriversListHeader;
