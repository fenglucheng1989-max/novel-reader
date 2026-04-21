package com.yourcompany.novelreader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yourcompany.novelreader.entity.AppUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AppUserMapper extends BaseMapper<AppUser> {
}
