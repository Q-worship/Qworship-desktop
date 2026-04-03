import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { obsService } from "@/services/OBSConnectionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Wifi, WifiOff, Settings } from "lucide-react";

const obsSettingsFormSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().min(1, "Port must be greater than 0").max(65535, "Port must be less than 65536"),
  password: z.string().optional(),
  isEnabled: z.boolean().default(false),
  autoConnect: z.boolean().default(false),
});

type OBSSettingsFormValues = z.infer<typeof obsSettingsFormSchema>;

interface OBSSettingsData {
  id?: number;
  userId: number;
  organizationId?: number;
  host: string;
  port: number;
  password?: string;
  isEnabled: boolean;
  autoConnect: boolean;
  sceneMappings?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function OBSSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const { data: obsSettings, isLoading } = useQuery<{ success: boolean; settings: OBSSettingsData | null }>({
    queryKey: ['/api/obs/settings'],
  });

  const form = useForm<OBSSettingsFormValues>({
    resolver: zodResolver(obsSettingsFormSchema),
    defaultValues: {
      host: "localhost",
      port: 4455,
      password: "",
      isEnabled: false,
      autoConnect: false,
    },
  });

  useEffect(() => {
    if (obsSettings?.settings) {
      form.reset({
        host: obsSettings.settings.host || "localhost",
        port: obsSettings.settings.port || 4455,
        password: obsSettings.settings.password || "",
        isEnabled: obsSettings.settings.isEnabled || false,
        autoConnect: obsSettings.settings.autoConnect || false,
      });
    }
  }, [obsSettings, form]);

  useEffect(() => {
    const unsubscribe = obsService.onStatusChange((status) => {
      setIsConnected(status.connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: OBSSettingsFormValues) => {
      const response = await apiRequest('POST', '/api/obs/settings', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your OBS settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/obs/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save OBS settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    const values = form.getValues();
    
    if (!values.host || !values.port) {
      toast({
        title: "Missing Information",
        description: "Please enter host and port before testing connection.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);

    try {
      await obsService.connect({
        host: values.host,
        port: values.port,
        password: values.password || "",
        isEnabled: true,
        autoConnect: false,
      });

      toast({
        title: "Connection Successful",
        description: "Successfully connected to OBS WebSocket.",
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to OBS. Please check your settings.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = (data: OBSSettingsFormValues) => {
    saveSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="obs-settings-loading">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="obs-settings-tab">
      <div>
        <h3 className="text-lg font-semibold text-white">OBS Integration</h3>
        <p className="text-sm text-gray-400 mt-1">
          Connect to OBS Studio to control scenes and recordings during your worship service.
        </p>
      </div>

      <Alert className={isConnected ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-gray-300"} data-testid="obs-connection-status">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Connected to OBS
              </AlertDescription>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-500" />
              <AlertDescription className="text-gray-600 dark:text-gray-400">
                Not connected to OBS
              </AlertDescription>
            </>
          )}
        </div>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-[#6366f1]" />
                Connection Settings
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure your OBS WebSocket connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Host</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="localhost"
                        {...field}
                        className="text-white placeholder:text-gray-400"
                        data-testid="input-obs-host"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      The hostname or IP address of your OBS instance
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="4455"
                        {...field}
                        className="text-white placeholder:text-gray-400"
                        data-testid="input-obs-port"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      WebSocket server port (default: 4455)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password if required"
                        {...field}
                        className="text-white placeholder:text-gray-400"
                        data-testid="input-obs-password"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 dark:text-gray-400">
                      WebSocket server password if authentication is enabled
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white">Integration Options</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configure how Q-worship interacts with OBS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">Enable OBS Integration</FormLabel>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Allow Q-worship to connect and control OBS
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-obs-enabled"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoConnect"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-white">Auto-Connect</FormLabel>
                      <FormDescription className="text-gray-600 dark:text-gray-400">
                        Automatically connect to OBS when Q-worship starts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-obs-autoconnect"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || !form.getValues("host") || !form.getValues("port")}
              className="text-gray-900 border-gray-300"
              data-testid="button-test-connection"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  {isConnected ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4 text-gray-400" />
                  )}
                  Test Connection
                </>
              )}
            </Button>

            <Button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              className="bg-[#6366f1] hover:bg-[#5558e3]"
              data-testid="button-save-obs-settings"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
