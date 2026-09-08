import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    CalendarRange,
    HandCoins,
    Landmark,
    Layers3,
    LayoutGrid,
    Map,
    PackageCheck,
    ReceiptText,
    ShieldCheck,
    UserRoundCheck,
    Users,
} from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import DistrictController from '@/actions/App/Http/Controllers/Admin/DistrictController';
import EventController from '@/actions/App/Http/Controllers/Admin/EventController';
import PastorController from '@/actions/App/Http/Controllers/Admin/PastorController';
import SectionController from '@/actions/App/Http/Controllers/Admin/SectionController';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import EventCheckInController from '@/actions/App/Http/Controllers/EventCheckInController';
import OnlineRegistrationController from '@/actions/App/Http/Controllers/OnlineRegistrationController';
import OnsiteRegistrationController from '@/actions/App/Http/Controllers/OnsiteRegistrationController';
import RegistrantApprovalController from '@/actions/App/Http/Controllers/RegistrantApprovalController';
import RegistrationVerificationController from '@/actions/App/Http/Controllers/RegistrationVerificationController';
import ReportsController, {
    onsiteCollectionIndex,
} from '@/actions/App/Http/Controllers/ReportsController';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { Auth, NavItem, NavItemGroup } from '@/types';

export function AppSidebar() {
    const { auth, appVersion, name } = usePage<{
        auth: Auth;
        appVersion: string;
        name: string;
    }>().props;
    const menuNavItems: NavItem[] = [
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
        ...(auth.can.viewReports
            ? [
                  {
                      title: 'Onsite Collection Report',
                      href: onsiteCollectionIndex(),
                      icon: HandCoins,
                  },
              ]
            : []),
        ...(auth.can.manageEventCheckIns
            ? [
                  {
                      title: 'Event Check-in',
                      href: EventCheckInController.index(),
                      icon: PackageCheck,
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
    ];

    const adminNavItems: NavItem[] = [
        ...(auth.can.manageEvents
            ? [
                  {
                      title: 'Events',
                      href: EventController.index(),
                      icon: CalendarRange,
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

    const navGroups: NavItemGroup[] = [
        {
            title: 'Menu',
            items: menuNavItems,
        },
        {
            title: 'Admin',
            items: adminNavItems,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="px-3 pt-3 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto overflow-hidden rounded-lg border border-sidebar-border/80 bg-linear-to-br from-sidebar-accent via-background to-sidebar-accent/70 p-0 shadow-sm ring-1 ring-white/70 transition-all group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! hover:border-teal-600/30 hover:shadow-md dark:ring-white/5"
                        >
                            <Link href={dashboard()} prefetch>
                                <span className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-teal-500 via-sky-500 to-amber-400 group-data-[collapsible=icon]:hidden" />
                                <div className="flex w-full items-center gap-3 px-3 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-teal-600 to-sky-700 text-white shadow-sm ring-1 ring-white/30 dark:from-teal-400 dark:to-sky-500 dark:text-neutral-950">
                                        <CalendarRange className="size-4" />
                                    </div>
                                    <div className="grid min-w-0 flex-1 gap-1 text-left group-data-[collapsible=icon]:hidden">
                                        <span className="truncate text-[13px] leading-tight font-bold text-sidebar-foreground">
                                            {name}
                                        </span>
                                        <span className="w-fit rounded-md border border-sidebar-border/70 bg-background/80 px-1.5 py-0.5 text-[10px] leading-tight font-semibold text-muted-foreground shadow-xs">
                                            App Version v.{appVersion}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>
        </Sidebar>
    );
}
