"use client";

/**
 * 🔍 Overlap Detector & Auto-Fixer
 * 
 * Automatically detects and fixes overlapping UI elements
 * Provides real-time monitoring and correction
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Zap,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface OverlapIssue {
  id: string;
  type: 'z-index' | 'positioning' | 'overflow' | 'clickability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element1: string;
  element2: string;
  description: string;
  autoFixable: boolean;
  fixed: boolean;
}

export function OverlapDetector() {
  const [isActive, setIsActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<OverlapIssue[]>([]);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  useEffect(() => {
    const performScan = async () => {
      setIsScanning(true);
      
      try {
        const detectedIssues: OverlapIssue[] = [];
        
        // Scan for z-index conflicts
        detectedIssues.push(...detectZIndexConflicts());
        
        // Scan for positioning overlaps
        detectedIssues.push(...detectPositioningOverlaps());
        
        // Scan for overflow issues
        detectedIssues.push(...detectOverflowIssues());
        
        // Scan for clickability problems
        detectedIssues.push(...detectClickabilityIssues());
        
        setIssues(detectedIssues);
        setLastScan(new Date());
        
        // Auto-fix if enabled
        if (autoFixEnabled) {
          await autoFixIssues(detectedIssues);
        }
        
      } catch (error) {
        console.error('Overlap scan failed:', error);
      } finally {
        setIsScanning(false);
      }
    };

    if (isActive) {
      // Initial scan
      performScan();
      
      // Set up periodic scanning
      const interval = setInterval(performScan, 10000); // Every 10 seconds
      
      // Set up mutation observer for DOM changes
      const observer = new MutationObserver(() => {
        if (autoFixEnabled) {
          setTimeout(performScan, 500); // Debounced scan
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      
      return () => {
        clearInterval(interval);
        observer.disconnect();
      };
    }
  }, [isActive, autoFixEnabled]);

  const performOverlapScan = async () => {
    setIsScanning(true);
    
    try {
      const detectedIssues: OverlapIssue[] = [];
      
      // Scan for z-index conflicts
      detectedIssues.push(...detectZIndexConflicts());
      
      // Scan for positioning overlaps
      detectedIssues.push(...detectPositioningOverlaps());
      
      // Scan for overflow issues
      detectedIssues.push(...detectOverflowIssues());
      
      // Scan for clickability problems
      detectedIssues.push(...detectClickabilityIssues());
      
      setIssues(detectedIssues);
      setLastScan(new Date());
      
      // Auto-fix if enabled
      if (autoFixEnabled) {
        await autoFixIssues(detectedIssues);
      }
      
    } catch (error) {
      console.error('Overlap scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const detectZIndexConflicts = (): OverlapIssue[] => {
    const issues: OverlapIssue[] = [];
    const elements = document.querySelectorAll('[style*="z-index"], [class*="z-"]');
    const zIndexMap = new Map<number, HTMLElement[]>();
    
    elements.forEach(el => {
      const element = el as HTMLElement;
      const computedStyle = window.getComputedStyle(element);
      const zIndex = parseInt(computedStyle.zIndex) || 0;
      
      if (!zIndexMap.has(zIndex)) {
        zIndexMap.set(zIndex, []);
      }
      zIndexMap.get(zIndex)!.push(element);
    });
    
    // Check for conflicts
    zIndexMap.forEach((elements, zIndex) => {
      if (elements.length > 1 && zIndex > 0) {
        const overlapping = elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        
        if (overlapping.length > 1) {
          issues.push({
            id: `z-conflict-${zIndex}`,
            type: 'z-index',
            severity: zIndex >= 50 ? 'high' : 'medium',
            element1: getElementSelector(overlapping[0]),
            element2: getElementSelector(overlapping[1]),
            description: `Multiple elements with z-index ${zIndex} may overlap`,
            autoFixable: true,
            fixed: false
          });
        }
      }
    });
    
    return issues;
  };

  const detectPositioningOverlaps = (): OverlapIssue[] => {
    const issues: OverlapIssue[] = [];
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"], .fixed');
    const absoluteElements = document.querySelectorAll('[style*="position: absolute"], [style*="position:absolute"], .absolute');
    
    const allPositioned = [...Array.from(fixedElements), ...Array.from(absoluteElements)];
    
    for (let i = 0; i < allPositioned.length; i++) {
      for (let j = i + 1; j < allPositioned.length; j++) {
        const el1 = allPositioned[i] as HTMLElement;
        const el2 = allPositioned[j] as HTMLElement;
        
        if (elementsOverlap(el1, el2)) {
          issues.push({
            id: `position-overlap-${i}-${j}`,
            type: 'positioning',
            severity: 'high',
            element1: getElementSelector(el1),
            element2: getElementSelector(el2),
            description: 'Positioned elements are overlapping',
            autoFixable: true,
            fixed: false
          });
        }
      }
    }
    
    return issues;
  };

  const detectOverflowIssues = (): OverlapIssue[] => {
    const issues: OverlapIssue[] = [];
    const containers = document.querySelectorAll('[style*="overflow"], .overflow-hidden, .overflow-auto');
    
    containers.forEach(container => {
      const containerEl = container as HTMLElement;
      const containerRect = containerEl.getBoundingClientRect();
      const children = containerEl.children;
      
      Array.from(children).forEach(child => {
        const childEl = child as HTMLElement;
        const childRect = childEl.getBoundingClientRect();
        
        if (childRect.bottom > containerRect.bottom + 5 || 
            childRect.right > containerRect.right + 5 ||
            childRect.top < containerRect.top - 5 ||
            childRect.left < containerRect.left - 5) {
          
          issues.push({
            id: `overflow-${getElementSelector(childEl)}`,
            type: 'overflow',
            severity: 'medium',
            element1: getElementSelector(containerEl),
            element2: getElementSelector(childEl),
            description: 'Child element overflows container bounds',
            autoFixable: true,
            fixed: false
          });
        }
      });
    });
    
    return issues;
  };

  const detectClickabilityIssues = (): OverlapIssue[] => {
    const issues: OverlapIssue[] = [];
    const clickableElements = document.querySelectorAll('button, [role="button"], a, input, select, textarea');
    
    clickableElements.forEach(el => {
      const element = el as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Check if element is too small for touch
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          id: `small-target-${getElementSelector(element)}`,
          type: 'clickability',
          severity: 'medium',
          element1: getElementSelector(element),
          element2: '',
          description: `Touch target too small (${Math.round(rect.width)}x${Math.round(rect.height)}px, should be 44x44px minimum)`,
          autoFixable: true,
          fixed: false
        });
      }
      
      // Check if element is hidden behind others
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      
      if (elementAtPoint && elementAtPoint !== element && !element.contains(elementAtPoint)) {
        issues.push({
          id: `hidden-clickable-${getElementSelector(element)}`,
          type: 'clickability',
          severity: 'high',
          element1: getElementSelector(element),
          element2: getElementSelector(elementAtPoint as HTMLElement),
          description: 'Clickable element is hidden behind another element',
          autoFixable: true,
          fixed: false
        });
      }
    });
    
    return issues;
  };

  const autoFixIssues = async (detectedIssues: OverlapIssue[]) => {
    const fixedIssues = [...detectedIssues];
    
    for (const issue of fixedIssues) {
      if (issue.autoFixable && !issue.fixed) {
        try {
          switch (issue.type) {
            case 'z-index':
              fixZIndexConflict(issue);
              break;
            case 'positioning':
              fixPositioningOverlap(issue);
              break;
            case 'overflow':
              fixOverflowIssue(issue);
              break;
            case 'clickability':
              fixClickabilityIssue(issue);
              break;
          }
          issue.fixed = true;
        } catch (error) {
          console.error(`Failed to fix issue ${issue.id}:`, error);
        }
      }
    }
    
    setIssues(fixedIssues);
  };

  const fixZIndexConflict = (issue: OverlapIssue) => {
    const elements = document.querySelectorAll(issue.element1 + ', ' + issue.element2);
    elements.forEach((el, index) => {
      const element = el as HTMLElement;
      const currentZ = parseInt(window.getComputedStyle(element).zIndex) || 0;
      element.style.zIndex = (currentZ + index + 1).toString();
    });
  };

  const fixPositioningOverlap = (issue: OverlapIssue) => {
    const el2 = document.querySelector(issue.element2) as HTMLElement;
    if (el2) {
      const rect = el2.getBoundingClientRect();
      el2.style.transform = `translateY(${rect.height + 10}px)`;
    }
  };

  const fixOverflowIssue = (issue: OverlapIssue) => {
    const container = document.querySelector(issue.element1) as HTMLElement;
    if (container) {
      container.style.overflow = 'auto';
      container.style.scrollBehavior = 'smooth';
    }
  };

  const fixClickabilityIssue = (issue: OverlapIssue) => {
    const element = document.querySelector(issue.element1) as HTMLElement;
    if (element) {
      if (issue.description.includes('too small')) {
        element.style.minWidth = '44px';
        element.style.minHeight = '44px';
        element.style.padding = '8px';
      } else if (issue.description.includes('hidden')) {
        const currentZ = parseInt(window.getComputedStyle(element).zIndex) || 0;
        element.style.zIndex = Math.max(currentZ + 10, 100).toString();
        element.style.position = 'relative';
      }
    }
  };

  // Helper functions
  const elementsOverlap = (el1: HTMLElement, el2: HTMLElement): boolean => {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
  };

  const getElementSelector = (element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return Layers;
      case 'low':
        return Eye;
      default:
        return CheckCircle;
    }
  };

  if (!isActive) {
    return (
      <Button
        onClick={() => setIsActive(true)}
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg glass-effect-optimized"
        title="Overlap Detector"
      >
        <Layers className="h-5 w-5" />
      </Button>
    );
  }

  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const fixedIssues = issues.filter(i => i.fixed).length;

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-96 max-h-96 shadow-xl glass-effect-optimized">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Overlap Detector
            {isScanning && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <Button
            onClick={() => setIsActive(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={criticalIssues > 0 ? "destructive" : highIssues > 0 ? "secondary" : "default"}>
            {issues.length} Issues
          </Badge>
          <Badge variant="outline">
            {fixedIssues} Fixed
          </Badge>
          {lastScan && (
            <span className="text-xs text-muted-foreground">
              {lastScan.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            onClick={performOverlapScan}
            disabled={isScanning}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Now
          </Button>
          
          <Button
            onClick={() => setAutoFixEnabled(!autoFixEnabled)}
            variant={autoFixEnabled ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Auto-Fix
          </Button>
        </div>

        {/* Issues List */}
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {issues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No overlap issues detected!</p>
              </div>
            ) : (
              issues.map((issue) => {
                const SeverityIcon = getSeverityIcon(issue.severity);
                
                return (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg border ${
                      issue.fixed ? 'bg-green-50 border-green-200' : 'bg-white/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(issue.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityIcon className="h-4 w-4" />
                          <Badge variant="outline" className="text-xs">
                            {issue.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.severity}
                          </Badge>
                          {issue.fixed && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Fixed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {issue.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {issue.element1} {issue.element2 && `↔ ${issue.element2}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}