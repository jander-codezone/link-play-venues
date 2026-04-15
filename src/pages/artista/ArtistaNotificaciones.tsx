import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  { id: 1, type: "success", title: "Contratación confirmada", message: "DJ Carlos ha confirmado el evento del 20 de diciembre", time: "Hace 2 horas", read: false },
  { id: 2, type: "warning", title: "Pago pendiente", message: "La factura FAC-002 está pendiente de pago", time: "Hace 5 horas", read: false },
  { id: 3, type: "info", title: "Nuevo artista disponible", message: "María López ha actualizado su disponibilidad para diciembre", time: "Hace 1 día", read: true },
  { id: 4, type: "info", title: "Recordatorio de evento", message: "Tienes un evento programado para mañana a las 21:00", time: "Hace 1 día", read: true },
];

const getIcon = (type: string) => {
  switch (type) {
    case "success": return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case "warning": return <AlertCircle className="h-5 w-5 text-amber-500" />;
    default: return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function ArtistaNotificaciones() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Bell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Centro de Notificaciones</h3>
            <p className="text-sm text-muted-foreground">{unreadCount} sin leer</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Marcar todas como leídas</Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-muted-foreground mb-4">Todas las notificaciones</p>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${notification.read ? "bg-muted/30" : "bg-muted/70"}`}
              >
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
