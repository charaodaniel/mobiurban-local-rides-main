
import { useState } from "react";
import DriverDetails from "./DriverDetails";
import DriversListHeader from "./DriversListHeader";
import DriversListSkeleton from "./DriversListSkeleton";
import DriversListEmpty from "./DriversListEmpty";
import DriverCard from "./DriverCard";
import { useDrivers, Driver } from "@/hooks/useDrivers";

interface DriversListProps {
  onBack: () => void;
}

const DriversList = ({ onBack }: DriversListProps) => {
  const { drivers, loading } = useDrivers();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  if (selectedDriver) {
    return (
      <DriverDetails 
        driver={selectedDriver} 
        onBack={() => setSelectedDriver(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <DriversListHeader onBack={onBack} driverCount={drivers.length} />

      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <DriversListSkeleton />
        ) : drivers.length === 0 ? (
          <DriversListEmpty />
        ) : (
          <div className="space-y-2">
            {drivers.map((driver) => (
              <DriverCard 
                key={driver.id} 
                driver={driver}
                onClick={() => setSelectedDriver(driver)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversList;
