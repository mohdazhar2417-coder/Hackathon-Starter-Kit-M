import { useGetFavorites, useRemoveFavorite } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Heart, Play } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORY_COLORS: Record<string, string> = {
  "Basic I/O & Math": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Conditionals": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Loops": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Number Logic": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Pattern Programs": "text-pink-400 bg-pink-400/10 border-pink-400/20",
};

export default function FavoritesPage() {
  const { toast } = useToast();
  const { data: favorites = [], refetch, isLoading } = useGetFavorites();
  const removeFav = useRemoveFavorite();

  const handleRemove = (id: number, name: string) => {
    removeFav.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Removed from favorites", description: `"${name}" removed.` });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Could not remove favorite.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-5 w-5 text-pink-400" />
              <h1 className="text-2xl font-bold">Favorites</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Programs you've bookmarked for quick access.
            </p>
          </div>
          <Link href="/workspace">
            <Button size="sm" className="gap-2">
              <Play className="h-3.5 w-3.5" />
              Browse Programs
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-lg bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border">
                <Heart className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-2">No favorites yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                While exploring programs in the Workspace, click the heart icon to save your favorites here.
              </p>
              <Link href="/workspace">
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Explore Programs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <Card key={fav.id} className="bg-card border-border hover:border-primary/30 transition-all group" data-testid={`favorite-${fav.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      className={`text-[10px] px-1.5 border ${CATEGORY_COLORS[fav.programCategory ?? ""] ?? "text-muted-foreground border-border"}`}
                      variant="outline"
                    >
                      {fav.programCategory}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="text-muted-foreground hover:text-pink-400 transition-colors"
                          data-testid={`remove-fav-${fav.id}`}
                        >
                          <Heart className="h-4 w-4 fill-pink-400 text-pink-400" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove favorite?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove "{fav.programName}" from your favorites?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemove(fav.id, fav.programName)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <h3 className="font-semibold text-sm mb-3 group-hover:text-primary transition-colors">{fav.programName}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    Added {fav.addedAt ? new Date(fav.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "recently"}
                  </div>
                  <Link href={`/workspace?program=${fav.programId}`}>
                    <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                      <Play className="h-3 w-3" />
                      Trace Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
