
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Search, ShoppingCart, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/useSearch";
import { useMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { search, results } = useSearch();
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim() === "") {
        setShowSearchResults(false);
        return;
      }

      await search(searchQuery);
      setShowSearchResults(true);
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, search]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("/explore", { state: { searchQuery } });
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const closeMenu = () => setOpen(false);

  const userNavItems = [
    { label: "Profile", href: "/profile", icon: <User className="h-4 w-4 mr-2" /> },
    { label: "My NFTs", href: "/profile", icon: <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { label: "My Listings", href: "/my-listings", icon: <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { label: "Create NFT", href: "/create", icon: <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> },
  ];

  const authButtons = (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                <AvatarFallback>{user.email?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userNavItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link to={item.href} className="flex items-center">
                  {item.icon}
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button onClick={() => navigate("/register")}>Register</Button>
        </div>
      )}
    </>
  );

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/explore" },
  ];

  const mobileMenu = (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="font-bold text-xl" onClick={closeMenu}>
              NFT Marketplace
            </Link>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          
          <div className="flex flex-col gap-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-2 py-1 text-lg hover:text-primary"
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
            
            {user && (
              <>
                {userNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="px-2 py-1 text-lg hover:text-primary flex items-center"
                    onClick={closeMenu}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="px-2 py-1 text-lg text-red-500 hover:text-red-600 text-left"
                >
                  Log out
                </button>
              </>
            )}
            
            {!user && (
              <div className="flex flex-col gap-2 mt-2">
                <Button onClick={() => { navigate("/login"); closeMenu(); }}>
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { navigate("/register"); closeMenu(); }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center justify-between w-full gap-4">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center">
            {isMobile && mobileMenu}
            <Link to="/" className="font-bold text-xl ml-2">
              NFT Marketplace
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 mx-4 max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search NFTs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </form>
            {showSearchResults && results.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg overflow-hidden">
                <div className="p-2">
                  <h3 className="text-sm font-semibold mb-2">Search Results</h3>
                  <div className="space-y-1">
                    {results.slice(0, 5).map((result) => (
                      <Link
                        key={result.id}
                        to={`/nft/${result.id}`}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchResults(false);
                        }}
                      >
                        <div className="h-8 w-8 rounded overflow-hidden bg-secondary">
                          <img
                            src={result.image || "/placeholder.svg"}
                            alt={result.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{result.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.price} ETH
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {results.length > 5 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        navigate("/explore", { state: { searchQuery } });
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                    >
                      View all {results.length} results
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart and Auth */}
          <div className="flex items-center gap-2">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping cart</span>
              </Button>
            </Link>
            {!isMobile && authButtons}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
