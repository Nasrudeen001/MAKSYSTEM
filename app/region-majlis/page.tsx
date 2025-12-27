"use client"

import { useState, useEffect } from "react"
import { MainNavigation } from "@/components/main-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, MapPin, Building, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Majlis {
  id: string
  name: string
  region_id: string
}

interface Region {
  id: string
  name: string
  majlis: Majlis[]
}

export default function RegionMajlisPage() {
  const { toast } = useToast()
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingRegion, setIsAddingRegion] = useState(false)
  const [isAddingMajlis, setIsAddingMajlis] = useState(false)
  const [newRegionName, setNewRegionName] = useState("")
  const [newMajlisName, setNewMajlisName] = useState("")
  const [selectedRegionForMajlis, setSelectedRegionForMajlis] = useState("")
  const [deletingRegionId, setDeletingRegionId] = useState<string | null>(null)
  const [deletingMajlisId, setDeletingMajlisId] = useState<string | null>(null)

  const fetchRegions = async () => {
    try {
      const response = await fetch("/api/regions")
      if (response.ok) {
        const data = await response.json()
        setRegions(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch regions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching regions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch regions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegions()
  }, [])

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) return

    try {
      const response = await fetch("/api/regions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newRegionName.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newRegion: Region = {
          ...result.region,
          majlis: [],
        }
        setRegions((prev) => [...prev, newRegion])
        setNewRegionName("")
        setIsAddingRegion(false)

        toast({
          title: "Region Added",
          description: `${newRegion.name} has been added successfully.`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add region",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding region:", error)
      toast({
        title: "Error",
        description: "Failed to add region",
        variant: "destructive",
      })
    }
  }

  const handleAddMajlis = async () => {
    if (!newMajlisName.trim() || !selectedRegionForMajlis) return

    try {
      const response = await fetch("/api/majlis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newMajlisName.trim(),
          regionId: selectedRegionForMajlis,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newMajlis: Majlis = result.majlis

        setRegions((prev) =>
          prev.map((region) =>
            region.id === selectedRegionForMajlis ? { ...region, majlis: [...region.majlis, newMajlis] } : region,
          ),
        )

        setNewMajlisName("")
        setSelectedRegionForMajlis("")
        setIsAddingMajlis(false)

        toast({
          title: "Majlis Added",
          description: `${newMajlis.name} has been added successfully.`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add majlis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding majlis:", error)
      toast({
        title: "Error",
        description: "Failed to add majlis",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRegion = async (regionId: string) => {
    setDeletingRegionId(regionId)
    try {
      const response = await fetch(`/api/regions/${regionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRegions((prev) => prev.filter((r) => r.id !== regionId))
        toast({
          title: "Region Deleted",
          description: "Region has been removed successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete region",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting region:", error)
      toast({
        title: "Error",
        description: "Failed to delete region",
        variant: "destructive",
      })
    } finally {
      setDeletingRegionId(null)
    }
  }

  const handleDeleteMajlis = async (regionId: string, majlisId: string) => {
    setDeletingMajlisId(majlisId)
    try {
      const response = await fetch(`/api/majlis/${majlisId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRegions((prev) =>
          prev.map((region) =>
            region.id === regionId ? { ...region, majlis: region.majlis.filter((m) => m.id !== majlisId) } : region,
          ),
        )

        toast({
          title: "Majlis Deleted",
          description: "Majlis has been removed successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete majlis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting majlis:", error)
      toast({
        title: "Error",
        description: "Failed to delete majlis",
        variant: "destructive",
      })
    } finally {
      setDeletingMajlisId(null)
    }
  }

  if (loading) {
    return (
      <div>
        <MainNavigation />
        <main className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading regions...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div>
      <MainNavigation />
      <main className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-8 gap-2 flex-wrap">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">Region & Majlis Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage regions and their respective majlis
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Dialog open={isAddingRegion} onOpenChange={setIsAddingRegion}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Region
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Region</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="regionName">Region Name</Label>
                    <Input
                      id="regionName"
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      placeholder="Enter region name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddRegion} className="flex-1">
                      Add Region
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingRegion(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingMajlis} onOpenChange={setIsAddingMajlis}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Majlis
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Majlis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="regionSelect">Select Region</Label>
                    <Select value={selectedRegionForMajlis} onValueChange={setSelectedRegionForMajlis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="majlisName">Majlis Name</Label>
                    <Input
                      id="majlisName"
                      value={newMajlisName}
                      onChange={(e) => setNewMajlisName(e.target.value)}
                      placeholder="Enter majlis name"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMajlis} className="flex-1">
                      Add Majlis
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingMajlis(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {regions.map((region) => (
            <Card key={region.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">{region.name}</CardTitle>
                    <Badge variant="secondary">{region.majlis.length} Majlis</Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent"
                        disabled={deletingRegionId === region.id}
                      >
                        {deletingRegionId === region.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Region</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {region.name}? This will also delete all associated majlis and
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRegion(region.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                {region.majlis.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No majlis added to this region yet</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {region.majlis.map((majlis) => (
                      <div
                        key={majlis.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{majlis.name}</span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              disabled={deletingMajlisId === majlis.id}
                            >
                              {deletingMajlisId === majlis.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Majlis</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {majlis.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMajlis(region.id, majlis.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {regions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Regions Added</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding regions and their respective majlis for participant registration
              </p>
              <Button onClick={() => setIsAddingRegion(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Region
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
