import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Building2, CalendarRange, Landmark, Layers3, LayoutGrid, Map, Menu, ReceiptText, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import ReportsController from '@/actions/App/Http/Controllers/ReportsController';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
import RegistrantApprovalController from '@/actions/App/Http/Controllers/RegistrantApprovalController';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationMenu } from '@/components/notification-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function AppHeader({ breadcrumbs: _breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(auth.can.manageOnlineRegistrations
            ? [
                  {
                      title: 'Online Registration',
                      href: OnlineRegistrationController.index(),
                      icon: ReceiptText,
                  },
              ]
            : []),
        ...(auth.can.manageOnsiteRegistrations
            ? [
                  {
                      title: 'Onsite Registration',
                      href: OnsiteRegistrationController.index(),
                      icon: ReceiptText,
                  },
              ]
            : []),
        ...(auth.can.reviewOnlineRegistrations
            ? [
                  {
                      title: 'Verification',
                      href: RegistrationVerificationController.index(),
                      icon: ShieldCheck,
                  },
              ]
            : []),
        ...(auth.can.reviewRegistrantAccounts
            ? [
                  {
                      title: 'Account Requests',
                      href: RegistrantApprovalController.index(),
                      icon: UserRoundCheck,
                  },
              ]
            : []),
        ...(auth.can.viewReports
            ? [
                  {
                      title: 'Reports',
                      href: ReportsController(),
                      icon: BarChart3,
                  },
              ]
            : []),
        ...(auth.can.manageUsers && auth.can.viewSystemAdminMenu
            ? [
                  {
                      title: 'Users',
                      href: UserController.index(),
                      icon: Users,
                  },
              ]
            : []),
        ...(auth.can.manageEvents
            ? [
                  {
                      title: 'Events',
                      href: EventController.index(),
                      icon: CalendarRange,
                  },
              ]
            : []),
        ...(auth.can.manageMasterData && auth.can.viewSystemAdminMenu
            ? [
                  {
                      title: 'Departments',
                      href: DepartmentController.index(),
                      icon: Landmark,
                  },
                  {
                      title: 'Districts',
                      href: DistrictController.index(),
                      icon: Map,
                  },
                  {
                      title: 'Sections',
                      href: SectionController.index(),
                      icon: Layers3,
                  },
                  {
                      title: 'Pastors',
                      href: PastorController.index(),
                      icon: Building2,
                  },
              ]
            : []),
    ];

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px]"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                ),
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {isCurrentUrl(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <NotificationMenu />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-10 gap-3 rounded-md px-1 py-1.5 sm:px-2"
                                >
                                    <Avatar className="size-8 shrink-0 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden min-w-0 text-left sm:block">
                                        <div className="truncate text-sm font-medium leading-tight">
                                            {auth.user.name}
                                        </div>
                                        {auth.user.role_name && (
                                            <div className="truncate text-xs text-muted-foreground">
                                                {auth.user.role_name}
                                            </div>
                                        )}
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {_breadcrumbs.length > 1 && (
                <div className="hidden w-full border-b border-sidebar-border/70 sm:flex">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={_breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
