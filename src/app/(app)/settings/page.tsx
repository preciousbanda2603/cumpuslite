
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Palette } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';

type ColorSettings = { h: number; s: number; l: number };
type ThemeSettings = {
  primaryColor: ColorSettings;
  backgroundColor: ColorSettings;
  secondaryColor: ColorSettings;
};

const defaultTheme = {
  primary: { h: 212, s: 72, l: 59 },
  background: { h: 45, s: 100, l: 98 },
  secondary: { h: 45, s: 60, l: 96 },
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  // State for Primary Color
  const [primaryHue, setPrimaryHue] = useState(defaultTheme.primary.h);
  const [primarySaturation, setPrimarySaturation] = useState(defaultTheme.primary.s);
  const [primaryLightness, setPrimaryLightness] = useState(defaultTheme.primary.l);

  // State for Background Color
  const [backgroundHue, setBackgroundHue] = useState(defaultTheme.background.h);
  const [backgroundSaturation, setBackgroundSaturation] = useState(defaultTheme.background.s);
  const [backgroundLightness, setBackgroundLightness] = useState(defaultTheme.background.l);

  // State for Secondary Color
  const [secondaryHue, setSecondaryHue] = useState(defaultTheme.secondary.h);
  const [secondarySaturation, setSecondarySaturation] = useState(defaultTheme.secondary.s);
  const [secondaryLightness, setSecondaryLightness] = useState(defaultTheme.secondary.l);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && schoolId) {
      setIsAdmin(user.uid === schoolId);
    }
  }, [user, schoolId]);

  useEffect(() => {
    if (!user || !schoolId) return;

    const settingsRef = ref(database, `schools/${schoolId}/settings/theme`);
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings: ThemeSettings = snapshot.val();
        if (settings.primaryColor) {
            setPrimaryHue(settings.primaryColor.h);
            setPrimarySaturation(settings.primaryColor.s);
            setPrimaryLightness(settings.primaryColor.l);
        }
        if (settings.backgroundColor) {
            setBackgroundHue(settings.backgroundColor.h);
            setBackgroundSaturation(settings.backgroundColor.s);
            setBackgroundLightness(settings.backgroundColor.l);
        }
        if (settings.secondaryColor) {
            setSecondaryHue(settings.secondaryColor.h);
            setSecondarySaturation(settings.secondaryColor.s);
            setSecondaryLightness(settings.secondaryColor.l);
        }
      } else {
        // If no settings in DB, reset to default state
        handleResetToDefault(false);
      }
      setLoading(false);
    });

    return () => unsubscribeSettings();
  }, [user, schoolId]);
  
  const handleSaveChanges = async () => {
    if (!user || !schoolId) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }
    
    setLoading(true);
    const themeData: ThemeSettings = {
        primaryColor: {
            h: primaryHue,
            s: primarySaturation,
            l: primaryLightness,
        },
        backgroundColor: {
            h: backgroundHue,
            s: backgroundSaturation,
            l: backgroundLightness,
        },
        secondaryColor: {
            h: secondaryHue,
            s: secondarySaturation,
            l: secondaryLightness,
        }
    };

    try {
        const settingsRef = ref(database, `schools/${schoolId}/settings/theme`);
        await set(settingsRef, themeData);
        toast({ title: 'Success!', description: 'Theme has been updated.' });
    } catch(error: any) {
        console.error("Failed to save theme:", error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };
  
  const handleResetToDefault = async (showToast = true) => {
    // Reset state
    setPrimaryHue(defaultTheme.primary.h);
    setPrimarySaturation(defaultTheme.primary.s);
    setPrimaryLightness(defaultTheme.primary.l);
    setBackgroundHue(defaultTheme.background.h);
    setBackgroundSaturation(defaultTheme.background.s);
    setBackgroundLightness(defaultTheme.background.l);
    setSecondaryHue(defaultTheme.secondary.h);
    setSecondarySaturation(defaultTheme.secondary.s);
    setSecondaryLightness(defaultTheme.secondary.l);

    // Remove from database if user is logged in
    if (user && schoolId) {
        setLoading(true);
        try {
            const settingsRef = ref(database, `schools/${schoolId}/settings/theme`);
            await remove(settingsRef);
            if (showToast) {
                toast({ title: 'Theme Reset', description: 'The theme has been reset to the system default.' });
            }
        } catch (error: any) {
            console.error("Failed to reset theme:", error);
            if (showToast) {
                toast({ title: 'Error', description: "Could not reset theme in the database.", variant: 'destructive' });
            }
        } finally {
            setLoading(false);
        }
    }
  };

  const primaryPreviewColor = `hsl(${primaryHue}, ${primarySaturation}%, ${primaryLightness}%)`;
  const backgroundPreviewColor = `hsl(${backgroundHue}, ${backgroundSaturation}%, ${backgroundLightness}%)`;
  const secondaryPreviewColor = `hsl(${secondaryHue}, ${secondarySaturation}%, ${secondaryLightness}%)`;

  const ColorEditor = ({ title, description, hue, setHue, saturation, setSaturation, lightness, setLightness, previewColor, disabled }: any) => (
     <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor={`${title}-hue`}>Hue</Label>
                        <Input 
                            id={`${title}-hue`}
                            type="number"
                            value={hue}
                            onChange={(e) => setHue(parseInt(e.target.value, 10) || 0)}
                            max={360}
                            min={0}
                            disabled={disabled}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor={`${title}-saturation`}>Saturation (%)</Label>
                        <Input 
                            id={`${title}-saturation`}
                            type="number"
                            value={saturation}
                            onChange={(e) => setSaturation(parseInt(e.target.value, 10) || 0)}
                            max={100}
                            min={0}
                            disabled={disabled}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor={`${title}-lightness`}>Lightness (%)</Label>
                        <Input 
                            id={`${title}-lightness`}
                            type="number"
                            value={lightness}
                            onChange={(e) => setLightness(parseInt(e.target.value, 10) || 0)}
                            max={100}
                            min={0}
                            disabled={disabled}
                        />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 bg-muted/50 rounded-lg p-6">
                    <p className="font-medium">Color Preview</p>
                    <div 
                        className="w-32 h-32 rounded-lg border-4"
                        style={{ backgroundColor: previewColor }}
                    />
                    <div className="text-center">
                        <p className="text-sm font-mono">{previewColor}</p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-8 w-8" />
            Theme Settings
          </h1>
          <p className="text-muted-foreground">
            Customize the application's appearance to match your school's colors.
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        <ColorEditor 
            title="Primary Color"
            description="Used for buttons, links, and other key interactive elements."
            hue={primaryHue} setHue={setPrimaryHue}
            saturation={primarySaturation} setSaturation={setPrimarySaturation}
            lightness={primaryLightness} setLightness={setPrimaryLightness}
            previewColor={primaryPreviewColor}
            disabled={!isAdmin}
        />
        <ColorEditor 
            title="Background Color"
            description="The main background color for the application."
            hue={backgroundHue} setHue={setBackgroundHue}
            saturation={backgroundSaturation} setSaturation={setBackgroundSaturation}
            lightness={backgroundLightness} setLightness={setBackgroundLightness}
            previewColor={backgroundPreviewColor}
            disabled={!isAdmin}
        />
        <ColorEditor 
            title="Secondary Color"
            description="Used for secondary elements and accents."
            hue={secondaryHue} setHue={setSecondaryHue}
            saturation={secondarySaturation} setSaturation={setSecondarySaturation}
            lightness={secondaryLightness} setLightness={setSecondaryLightness}
            previewColor={secondaryPreviewColor}
            disabled={!isAdmin}
        />
      </div>

       {isAdmin && (
        <div className="flex justify-end mt-6 gap-2">
            <Button onClick={() => handleResetToDefault()} variant="outline" disabled={loading}>
                Reset to Default
            </Button>
            <Button onClick={handleSaveChanges} disabled={loading} size="lg">
                {loading ? 'Saving...' : 'Save All Changes'}
            </Button>
        </div>
       )}
    </div>
  );
}
