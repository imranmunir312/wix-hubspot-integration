import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormContextEvent } from './form-context.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FormContextEvent])],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
