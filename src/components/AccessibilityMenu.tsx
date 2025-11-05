import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Settings, Volume2, Eye, Type, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const AccessibilityMenu = () => {
  const { fontSize, setFontSize, highContrast, toggleHighContrast, voiceEnabled, toggleVoice, theme, toggleTheme } = useAccessibility();
  const { language, setLanguage } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Accessibility Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Language / Lugha
            </Label>
            <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'sw')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Kiswahili</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Font Size
            </Label>
            <Select value={fontSize} onValueChange={(val) => setFontSize(val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <Label htmlFor="contrast" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              High Contrast
            </Label>
            <Switch
              id="contrast"
              checked={highContrast}
              onCheckedChange={toggleHighContrast}
            />
          </div>

          {/* Voice Output */}
          <div className="flex items-center justify-between">
            <Label htmlFor="voice" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Output
            </Label>
            <Switch
              id="voice"
              checked={voiceEnabled}
              onCheckedChange={toggleVoice}
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="flex items-center gap-2">
              {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
            </Label>
            <Switch
              id="theme"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
