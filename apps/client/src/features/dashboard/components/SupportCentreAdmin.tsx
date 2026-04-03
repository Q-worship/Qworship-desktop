import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MessageSquare, Clock, CheckCircle, XCircle, User, Calendar, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: number;
  responseMessage?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export const SupportCentreAdmin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [responseMessage, setResponseMessage] = useState("");

  // Fetch all support tickets
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/support-tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/support-tickets');
      return await response.json();
    }
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: number; updates: any }) => {
      const response = await apiRequest('PUT', `/api/admin/support-tickets/${ticketId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "Support ticket has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      setSelectedTicket(null);
      setResponseMessage("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update support ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket: SupportTicket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const handleUpdateStatus = (ticketId: number, status: string) => {
    const updates: any = { status };
    if (responseMessage.trim()) {
      updates.responseMessage = responseMessage;
    }
    updateTicketMutation.mutate({ ticketId, updates });
  };

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t: SupportTicket) => t.status === 'open').length,
    inProgress: tickets.filter((t: SupportTicket) => t.status === 'in_progress').length,
    resolved: tickets.filter((t: SupportTicket) => t.status === 'resolved').length,
    highPriority: tickets.filter((t: SupportTicket) => t.priority === 'high').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-white">Loading support tickets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Support Centre</h2>
          <p className="text-gray-400">Manage customer support tickets and inquiries</p>
        </div>
        <Button onClick={() => refetch()} className="bg-purple-600 hover:bg-purple-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ticketStats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{ticketStats.open}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{ticketStats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{ticketStats.resolved}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{ticketStats.highPriority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open" className="text-red-400">Open</SelectItem>
                  <SelectItem value="in_progress" className="text-yellow-400">In Progress</SelectItem>
                  <SelectItem value="resolved" className="text-green-400">Resolved</SelectItem>
                  <SelectItem value="closed" className="text-gray-400">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high" className="text-red-400">High</SelectItem>
                  <SelectItem value="medium" className="text-yellow-400">Medium</SelectItem>
                  <SelectItem value="low" className="text-green-400">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Support Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No support tickets found matching your criteria.</p>
              </div>
            ) : (
              filteredTickets.map((ticket: SupportTicket) => (
                <div key={ticket.id} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{ticket.subject}</h3>
                        <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <AlertTriangle className={`w-4 h-4 ${getPriorityColor(ticket.priority)}`} />
                      </div>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{ticket.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.user?.email || `User #${ticket.userId}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        <span className="capitalize">{ticket.category}</span>
                        <span className="capitalize text-yellow-400">{ticket.priority} priority</span>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-600 text-white max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Support Ticket #{ticket.id}</DialogTitle>
                        </DialogHeader>
                        
                        <Tabs defaultValue="details" className="space-y-4">
                          <TabsList className="bg-gray-700">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="respond">Respond</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-300">Subject</Label>
                                <p className="text-white font-medium">{ticket.subject}</p>
                              </div>
                              <div>
                                <Label className="text-gray-300">Status</Label>
                                <Badge className={`${getStatusColor(ticket.status)} text-white ml-2`}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-gray-300">Priority</Label>
                                <p className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority.toUpperCase()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-300">Category</Label>
                                <p className="text-white capitalize">{ticket.category}</p>
                              </div>
                              <div>
                                <Label className="text-gray-300">User</Label>
                                <p className="text-white">{ticket.user?.email || `User #${ticket.userId}`}</p>
                              </div>
                              <div>
                                <Label className="text-gray-300">Created</Label>
                                <p className="text-white">{format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-gray-300">Message</Label>
                              <div className="bg-gray-700 p-3 rounded-md mt-1">
                                <p className="text-white whitespace-pre-wrap">{ticket.message}</p>
                              </div>
                            </div>
                            
                            {ticket.responseMessage && (
                              <div>
                                <Label className="text-gray-300">Admin Response</Label>
                                <div className="bg-purple-900/30 p-3 rounded-md mt-1 border border-purple-500/30">
                                  <p className="text-white whitespace-pre-wrap">{ticket.responseMessage}</p>
                                </div>
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="respond" className="space-y-4">
                            <div>
                              <Label className="text-gray-300">Response Message</Label>
                              <Textarea
                                placeholder="Enter your response to the customer..."
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                className="bg-gray-700 border-gray-600 text-white mt-1"
                                rows={4}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                                disabled={updateTicketMutation.isPending}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Mark In Progress
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                disabled={updateTicketMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Resolved
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                                disabled={updateTicketMutation.isPending}
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Close Ticket
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};