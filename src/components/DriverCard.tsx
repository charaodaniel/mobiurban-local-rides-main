
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Send } from "lucide-react";
import { Driver } from "@/hooks/useDrivers";

interface DriverCardProps {
  driver: Driver;
  onClick: () => void;
}

const DriverCard = ({ driver, onClick }: DriverCardProps) => {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${driver.users.phone}`, '_self');
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://wa.me/${driver.users.phone.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <Card 
      className="hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02] bg-white/80 backdrop-blur"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-green-500">
            <AvatarImage src={driver.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.users.name}`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
              {driver.users.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">
                {driver.users.name}
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                Online
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="truncate">
                {driver.vehicle_color} {driver.vehicle_model} {driver.vehicle_year}
              </span>
              <span className="flex items-center gap-1">
                ⭐ {driver.rating?.toFixed(1) || '5.0'}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              R$ {driver.price_per_km.toFixed(2)}/km
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
              onClick={handleWhatsApp}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverCard;
