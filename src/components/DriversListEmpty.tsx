
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const DriversListEmpty = () => {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="text-gray-500 mb-4">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum motorista online</p>
          <p className="text-sm mt-2">Tente novamente em alguns instantes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriversListEmpty;
