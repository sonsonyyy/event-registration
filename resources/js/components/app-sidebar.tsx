import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Building2, CalendarRange, Landmark, Layers3, LayoutGrid, Map, ReceiptText, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
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
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
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
        ...(auth.can.manageUsers
            && auth.can.viewSystemAdminMenu
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
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/60 p-3 group-data-[collapsible=icon]:hidden">
                <div className="rounded-md border border-sidebar-border/70 bg-sidebar-accent/70 px-3 py-3">
                    <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Version {appVersion}
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
