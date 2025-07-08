
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone, Send, MessageCircle, Star, Car } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ChatModal from "./ChatModal";

interface Driver {
  id: string;
  user_id: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_year: number;
  price_per_km: number;
  rating: number;
  profile_photo_url?: string;
  car_photo_url?: string;
  users: {
    name: string;
    phone: string;
  };
}

interface DriverDetailsProps {
  driver: Driver;
  onBack: () => void;
}

const DriverDetails = ({ driver, onBack }: DriverDetailsProps) => {
  const [showChat, setShowChat] = useState(false);

  const handleCall = () => {
    window.open(`tel:${driver.users.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const phone = driver.users.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Detalhes do Motorista</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Driver Info Card */}
          <Card className="bg-white/80 backdrop-blur shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-green-500">
                  <AvatarImage src={driver.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.users.name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-2xl">
                    {driver.users.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {driver.users.name}
                </h2>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-medium">{driver.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
              </div>

              {/* Car Photo */}
              {driver.car_photo_url && (
                <div className="mb-6">
                  <img
                    src={driver.car_photo_url}
                    alt="Foto do carro"
                    className="w-full h-48 rounded-lg object-cover border-2 border-gray-200"
                  />
                </div>
              )}

              {/* Vehicle Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Informações do Veículo</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Modelo:</span>
                    <p className="font-medium">{driver.vehicle_model}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ano:</span>
                    <p className="font-medium">{driver.vehicle_year}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cor:</span>
                    <p className="font-medium">{driver.vehicle_color}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Placa:</span>
                    <p className="font-medium font-mono">{driver.vehicle_plate}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-1">Preço por quilômetro</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {driver.price_per_km.toFixed(2)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={handleCall}
                  className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Ligar para {driver.users.name}
                </Button>
                
                <Button 
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="h-12 border-green-600 text-green-700 hover:bg-green-50"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Enviar WhatsApp
                </Button>
                
                <Button 
                  onClick={() => setShowChat(true)}
                  variant="outline"
                  className="h-12 border-purple-600 text-purple-700 hover:bg-purple-50"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Abrir Chat Interno
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <ChatModal 
          driver={driver} 
          onClose={() => setShowChat(false)} 
        />
      )}
    </>
  );
};

export default DriverDetails;
