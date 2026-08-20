import AuthSwagger from '../swagger/auth.swagger.js';
import env from '../config/environment.config.js';
import UserSwagger from './user.swagger.js';
import MauDonSwagger from './mau-don.swagger.js';
import UyBanSwagger from './uy-ban.swagger.js';
import ThuTucSwagger from './thu-tuc.swagger.js';
import CoSoDichVuCongSwagger from './co-so-dich-vu-cong.swagger.js';
import LinhVucSwagger from './linh-vuc.swagger.js';
import TinTucSwagger from './tin-tuc.swagger.js';
import DanhMucTinTucSwagger from './danh-muc-tin-tuc.swagger.js';
import LichTiepDanSwagger from './lich-tiep-dan.swagger.js';
import LinhVucPhanAnhSwagger from './linh-vuc-phan-anh.swagger.js';
import PhanAnhSwagger from './phan-anh.swagger.js';
import VideoUploadSwagger from './video-upload.swagger.js';
import ReportSwagger from './report.swagger.js';
import RoleSwagger from './role.swagger.js';
import PermissionSwagger from './permission.swagger.js';
import NotificationSwagger from './notification.swagger.js';
import AuditLogSwagger from './audit-log.swagger.js';
import ExportSwagger from './export.swagger.js';
import AddressVote from './address-vote.swagger.js';
import DangKyTiepDanSwagger from './dang-ky-tiep-dan.swagger.js';
import ReceptionScheduleSwagger from './reception-schedule.swagger.js';
import ReceptionScheduleManagementSwagger from './reception-schedule-management.swagger.js';
import ReceptionRatingSwagger from './reception-rating.swagger.js';
import ReceptionCounterSwagger from './reception-counter.swagger.js';
import ReceptionCounterAssignmentSwagger from './reception-counter-assignment.swagger.js';
import LeaderMeetingScheduleSwagger from './leader-meeting-schedule.swagger.js';
import LeaderMeetingRegistrationSwagger from './leader-meeting-registration.swagger.js';
import LeaderMeetingRatingSwagger from './leader-meeting-rating.swagger.js';

const swaggerDocument = {

    openapi: '3.0.0',
    info: {
        title: `${env.APP_NAME} API Documentation`,
        version: '1.0.0',
    },

    // servers: [
    //     {
    //         url: 'http://localhost:8880',  // Địa chỉ API cho môi trường phát triển
    //         description: 'Local Development',
    //     },
    // ],

    paths: {
        ...AuthSwagger,
        ...UserSwagger,
        ...MauDonSwagger,
        ...UyBanSwagger,
        ...ThuTucSwagger,
        ...CoSoDichVuCongSwagger,
        ...LinhVucSwagger,
        ...TinTucSwagger,
        ...DanhMucTinTucSwagger,
        ...LichTiepDanSwagger,
        ...LinhVucPhanAnhSwagger,
        ...PhanAnhSwagger,
        ...VideoUploadSwagger,
        ...ReportSwagger,
        ...RoleSwagger,
        ...PermissionSwagger,
        ...NotificationSwagger,
        ...AuditLogSwagger,
        ...ExportSwagger,
        ...AddressVote,
        ...DangKyTiepDanSwagger,
        ...ReceptionScheduleSwagger,
        ...ReceptionScheduleManagementSwagger,
        ...ReceptionRatingSwagger,
        ...ReceptionCounterSwagger,
        ...ReceptionCounterAssignmentSwagger,
        ...LeaderMeetingScheduleSwagger,
        ...LeaderMeetingRegistrationSwagger,
        ...LeaderMeetingRatingSwagger
    },

    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
};
export default swaggerDocument;

