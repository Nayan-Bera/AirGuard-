'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Leaf,
  MapPin,
  Pencil,
  Plus,
  Lightbulb,
  Sprout,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { plantSchema } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils';
import {
  COMMON_INDOOR_PLANTS,
  PLANT_LOCATION_LABELS,
  getPlantBenefitInfo,
} from '@/components/home-profile/home-profile-utils';
import type { HouseholdPlant } from '@/types';

type PlantFormValues = z.infer<typeof plantSchema>;

interface PlantManagerProps {
  plants: HouseholdPlant[];
  onAddPlant: (plant: Omit<HouseholdPlant, 'id' | 'householdId'>) => void;
  onUpdatePlant: (id: string, updates: Omit<HouseholdPlant, 'id' | 'householdId'>) => void;
  onRemovePlant: (id: string) => void;
  compact?: boolean;
}

function RatingIndicator({ rating }: { rating: 'High' | 'Good' | 'Moderate' }) {
  const level = rating === 'High' ? 3 : rating === 'Good' ? 2 : 1;
  const colorClass =
    rating === 'High'
      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : rating === 'Good'
        ? 'text-teal-600 dark:text-teal-400 border-teal-500/30 bg-teal-500/10'
        : 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10';

  const barActive =
    rating === 'High'
      ? 'bg-emerald-500'
      : rating === 'Good'
        ? 'bg-teal-500'
        : 'bg-amber-500';

  return (
    <Badge variant="outline" className={cn('gap-1.5 text-[11px]', colorClass)}>
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              'w-1 rounded-full transition-colors',
              step === 1 ? 'h-1.5' : step === 2 ? 'h-2' : 'h-2.5',
              step <= level ? barActive : 'bg-muted-foreground/25'
            )}
          />
        ))}
      </span>
      <span>{rating} Purifying</span>
    </Badge>
  );
}

export function PlantManager({
  plants,
  onAddPlant,
  onUpdatePlant,
  onRemovePlant,
  compact = false,
}: PlantManagerProps) {
  const [showAddForm, setShowAddForm] = React.useState(compact);
  const [editingPlant, setEditingPlant] = React.useState<HouseholdPlant | null>(null);

  const addForm = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: '',
      type: '',
      location: 'living_room',
      notes: '',
    },
  });

  const editForm = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      name: '',
      type: '',
      location: 'living_room',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (editingPlant) {
      editForm.reset({
        name: editingPlant.name,
        type: editingPlant.type ?? '',
        location: editingPlant.location || 'living_room',
        notes: editingPlant.notes ?? '',
      });
    }
  }, [editingPlant, editForm]);

  const handleAddSubmit = (values: PlantFormValues) => {
    const info = getPlantBenefitInfo(values.name, values.type);
    onAddPlant({
      name: values.name.trim(),
      type: values.type?.trim() || undefined,
      location: values.location,
      airPurifyingRating: info.rating,
      notes: values.notes?.trim() || undefined,
    });
    addForm.reset({
      name: '',
      type: '',
      location: values.location,
      notes: '',
    });
    if (!compact) {
      setShowAddForm(false);
    }
  };

  const handleEditSubmit = (values: PlantFormValues) => {
    if (!editingPlant) return;
    const info = getPlantBenefitInfo(values.name, values.type);
    onUpdatePlant(editingPlant.id, {
      name: values.name.trim(),
      type: values.type?.trim() || undefined,
      location: values.location,
      airPurifyingRating: info.rating,
      notes: values.notes?.trim() || undefined,
    });
    setEditingPlant(null);
  };

  const applyPreset = (preset: (typeof COMMON_INDOOR_PLANTS)[number]) => {
    addForm.setValue('name', preset.name, { shouldValidate: true });
    addForm.setValue('type', preset.type);
    setShowAddForm(true);
  };

  return (
    <Card className="border border-white/50 bg-white/80 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/70">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sprout className="size-4.5 text-emerald-500" />
            Indoor Plants
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {plants.length}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Track air-purifying plants and where they are placed in your home
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant={showAddForm ? 'outline' : 'default'}
          onClick={() => setShowAddForm((prev) => !prev)}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          {showAddForm ? 'Hide Form' : 'Add Plant'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Preset Chips */}
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lightbulb className="size-3.5 text-emerald-500" />
            Quick-fill popular air-purifying plants:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_INDOOR_PLANTS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                <Leaf className="size-3 text-emerald-500" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Add Plant Form */}
        <AnimatePresence initial={false}>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={addForm.handleSubmit(handleAddSubmit)}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3.5 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="plant-name">Plant Name *</Label>
                    <Input
                      id="plant-name"
                      placeholder="e.g., Snake Plant"
                      {...addForm.register('name')}
                      aria-invalid={Boolean(addForm.formState.errors.name)}
                    />
                    {addForm.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {addForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="plant-type">Type / Variety</Label>
                    <Input
                      id="plant-type"
                      placeholder="e.g., Sansevieria"
                      {...addForm.register('type')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="plant-location">Room Location *</Label>
                    <Controller
                      control={addForm.control}
                      name="location"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) field.onChange(value);
                          }}
                        >
                          <SelectTrigger id="plant-location" className="w-full">
                            <SelectValue placeholder="Select room">
                              {(val: string | null) =>
                                val
                                  ? PLANT_LOCATION_LABELS[val] ?? val
                                  : 'Select room'
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PLANT_LOCATION_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {addForm.formState.errors.location && (
                      <p className="text-xs text-destructive">
                        {addForm.formState.errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="plant-notes">Notes (optional)</Label>
                    <Input
                      id="plant-notes"
                      placeholder="e.g., Near south window, watered twice a week"
                      {...addForm.register('notes')}
                    />
                  </div>
                  <Button type="submit" className="gap-1.5 sm:w-auto">
                    <Plus className="size-4" />
                    Add to Home
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Plant List */}
        {plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/25 px-4 py-8 text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <Sprout className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No indoor plants added yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Add your plants above or pick a quick preset to track greenery across your rooms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {plants.map((plant) => {
              const benefitInfo = getPlantBenefitInfo(
                plant.name,
                plant.type,
                plant.airPurifyingRating
              );
              const locationLabel =
                PLANT_LOCATION_LABELS[plant.location] ?? plant.location;

              return (
                <motion.div
                  key={plant.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-3 transition-colors hover:border-emerald-500/35 hover:bg-accent/30"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                      <Leaf className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {plant.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                aria-label={`Air purifying benefit info for ${plant.name}`}
                                className="inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              />
                            }
                          >
                            <Info className="size-3.5" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs space-y-1 p-2.5 text-left">
                            <p className="font-semibold">{plant.name} Benefits</p>
                            <p className="opacity-90">{benefitInfo.benefit}</p>
                            <p className="text-[11px] opacity-75">
                              Care: {benefitInfo.careTip}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {plant.type && (
                        <p className="truncate text-xs text-muted-foreground">
                          {plant.type}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <MapPin className="size-2.5" />
                          {locationLabel}
                        </Badge>
                        <RatingIndicator rating={benefitInfo.rating} />
                      </div>

                      {plant.notes && (
                        <p className="line-clamp-1 pt-0.5 text-[11px] text-muted-foreground">
                          {plant.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setEditingPlant(plant)}
                      aria-label={`Edit ${plant.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => onRemovePlant(plant.id)}
                      aria-label={`Remove ${plant.name}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Plant Dialog */}
      <Dialog
        open={Boolean(editingPlant)}
        onOpenChange={(open) => {
          if (!open) setEditingPlant(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="size-4 text-emerald-500" />
              Edit Plant
            </DialogTitle>
            <DialogDescription>
              Update the plant details, variety, or room placement.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editForm.handleSubmit(handleEditSubmit)}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="edit-plant-name">Plant Name *</Label>
              <Input
                id="edit-plant-name"
                {...editForm.register('name')}
                aria-invalid={Boolean(editForm.formState.errors.name)}
              />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-plant-type">Type / Variety</Label>
              <Input id="edit-plant-type" {...editForm.register('type')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-plant-location">Room Location *</Label>
              <Controller
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="edit-plant-location" className="w-full">
                      <SelectValue placeholder="Select room">
                        {(val: string | null) =>
                          val ? PLANT_LOCATION_LABELS[val] ?? val : 'Select room'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLANT_LOCATION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-plant-notes">Notes</Label>
              <Input id="edit-plant-notes" {...editForm.register('notes')} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPlant(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

