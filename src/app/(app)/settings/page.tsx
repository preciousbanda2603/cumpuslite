
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
import { ref, onValue, set } from 'firebase/database';
import type { User } from 'firebase/auth';

type ThemeSettings = {
  primaryColor: {
    h: number;
    s: number;
    l: number;
  };
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [hue, setHue] = useState(212);
  const [saturation, setSaturation] = useState(72);
  const [lightness, setLightness] = useState(59);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const settingsRef = ref(database, `schools/${user.uid}/settings/theme`);
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings: ThemeSettings = snapshot.val();
        const { h, s, l } = settings.primaryColor;
        setHue(h);
        setSaturation(s);
        setLightness(l);
      }
      setLoading(false);
    });

    return () => unsubscribeSettings();
  }, [user]);
  
  const handleSaveChanges = async () => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }
    
    setLoading(true);
    const themeData: ThemeSettings = {
        primaryColor: {
            h: hue,
            s: saturation,
            l: lightness,
        }
    };

    try {
        const settingsRef = ref(database, `schools/${user.uid}/settings/theme`);
        await set(settingsRef, themeData);
        toast({ title: 'Success!', description: 'Theme has been updated.' });
    } catch(error: any) {
        console.error("Failed to save theme:", error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };
  
  const previewColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

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

      <Card>
        <CardHeader>
          <CardTitle>Primary Color</CardTitle>
          <CardDescription>
            Adjust the HSL values to set the main theme color. Changes will be applied globally.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="hue">Hue</Label>
                        <Input 
                            id="hue"
                            type="number"
                            value={hue}
                            onChange={(e) => setHue(parseInt(e.target.value, 10))}
                            max={360}
                            min={0}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="saturation">Saturation (%)</Label>
                        <Input 
                            id="saturation"
                            type="number"
                            value={saturation}
                            onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                            max={100}
                            min={0}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="lightness">Lightness (%)</Label>
                        <Input 
                            id="lightness"
                            type="number"
                            value={lightness}
                            onChange={(e) => setLightness(parseInt(e.target.value, 10))}
                            max={100}
                            min={0}
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
                        <p className="text-xs text-muted-foreground">This color will be used for buttons, links, and other primary elements.</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <Button onClick={handleSaveChanges} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
